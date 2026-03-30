# Design Decisions

## Decision: Zod Validation as Express Middleware

**Context:** Every route that accepts input needs validation. The question was where to run Zod schemas — inside each route handler or as a reusable middleware step.

**Options Considered:**
- Option A: Inline validation inside each route handler — call `schema.safeParse(req.body)` directly and handle errors there
- Option B: Middleware factory (`validate()`) — runs before the handler, short-circuits on failure, overwrites `req.body`/`req.params` with parsed output

**Choice:** Inline validation inside each route handler

**Why:** Inline validation with `schema.safeParse()` gives fully inferred types in the handler body — no casting required. It's also explicit: the reader sees exactly what is being validated and where without tracing middleware chains.

## Decision: API Versioning from the Start

**Context:** Decide whether to prefix all routes with a version segment (`/api/v1/`) immediately or add it later if needed.

**Options Considered:**
- Option A: No versioning — mount routes at `/cart`, `/checkout`, etc. and add versioning if a breaking change ever arises
- Option B: Version from day one — mount all routes under `/api/v1/`

**Choice:** Version from day one (`/api/v1/`)

**Why:** Adding a version prefix after clients are already integrated is a breaking change. Doing it upfront costs nothing (one string in `app.ts`) and gives consumers a stable contract — if a v2 is ever needed, v1 can coexist without disruption. The `/api/` prefix also cleanly separates API routes from any future static file serving or health endpoints at the root.

## Decision: In-Memory Store as a Module Singleton with getStore()/resetStore()

**Context:** The store must be shared across the app but easily wiped between tests. The question was how to expose it.

**Options Considered:**
- Option A: Export the store object directly — `import { store } from './store'`
- Option B: Export accessor functions — `getStore()` returns the live instance, `resetStore()` replaces it with a fresh one

**Choice:** Accessor functions (`getStore()` / `resetStore()`)

**Why:** Direct export makes the reference fixed at import time — tests that `resetStore()` would need to re-import the module or mutate the exported object in place, both of which are fragile. Accessor functions decouple consumers from the instance lifecycle: `resetStore()` swaps the internal reference and every subsequent `getStore()` call sees the fresh store automatically. This makes `beforeEach(() => resetStore())` in tests completely reliable with no module cache tricks.

## Decision: User Identity via Route Param Instead of Auth Token

**Context:** Cart and checkout endpoints need to know which user is acting. The question was where that identity comes from — a route parameter supplied by the client, or a token the server decodes.

**Options Considered:**
- Option A: Auth token (JWT/session) — middleware decodes the token, attaches `req.user.id`, and handlers read from there. The client never sends a raw userId.
- Option B: `/:userId` route param — the caller passes their own ID in the URL; no auth layer required.

**Choice:** Route param (`/:userId`) for now

**Why:** This is a deliberate short-cut for quick iteration. Implementing real auth (token issuance, middleware, refresh logic) is significant scope that would delay getting the core cart/checkout/discount logic built and testable. A userId in the URL lets the API be exercised end-to-end immediately.

The trade-off is real: any caller can impersonate any user by changing the param — there is no identity verification. This is acceptable only because the API is not yet exposed publicly. When auth is added, the migration path is straightforward: replace `req.params.userId` with `req.user.id` (set by auth middleware) in controllers, and remove the param from the route definition. The controller TODO comment marks this seam explicitly.
## Decision: Admin Stats Computed On-the-Fly vs. Maintained Running Totals

**Context:** The admin stats endpoint needs to report total orders, items purchased, revenue, and discount amounts. The question was whether to recompute these by scanning the orders array on each request, or to maintain a running-total object that is updated at checkout time.

**Options Considered:**
- Option A: On-the-fly scan — iterate `store.orders` on each `GET /admin/stats` call
- Option B: Running totals — keep a `stats` object in the store and increment it inside `checkout()`

**Choice:** On-the-fly scan

**Why:** With an in-memory store and the order volumes expected here, a linear scan is negligible. Running totals add a write path that must be kept in sync with the order data — if checkout is updated (e.g. refunds, cancellations) the totals would need equivalent updates too, creating two sources of truth. The scan approach keeps the stats derived from the single authoritative source (`store.orders`), which is simpler and always correct. If order volume ever reached a scale where the scan became a bottleneck, a caching layer (e.g. memoise with a dirty flag) could be introduced without changing the service contract.

## Decision: Discount Milestone Tracked Globally (Total Orders) Not Per-User

**Context:** The assignment says "every nth order gets a coupon code". This is ambiguous — it could mean every nth order placed across the entire store (global), or every nth order placed by the same user (per-user loyalty).

**Options Considered:**
- Option A: Global counter — after every nth order store-wide, one code becomes available. Admin generates it and distributes it to a customer manually (e.g. via email).
- Option B: Per-user counter — after a specific user places their nth order, that user personally earns a code. Admin generates it scoped to that userId.

**Choice:** Global counter

**Why:** The assignment describes an admin API that generates a code "if the condition is satisfied" — a single condition checked against a single counter fits this model cleanly. It also keeps the store simpler (one `orderCounter` vs a per-user `Map<string, number>`). The generated code is single-use and can be targeted to any customer the admin chooses, which gives the business flexibility.

The per-user model is a better fit for a loyalty programme ("rewards customers" for repeat purchases). If that intent is confirmed, the migration is straightforward: replace `store.orderCounter` checks with `store.orders.filter(o => o.userId === userId).length`, and add a `userId` param to the generate endpoint.

## Decision: Discount Code Generation is Admin-Triggered, Not Automatic

**Context:** When the nth order is placed, a discount code becomes available. The question was whether to auto-generate it inside `checkout()` or require an explicit admin API call.

**Options Considered:**
- Option A: Auto-generate — `checkout()` checks `orderCounter % nthOrder === 0` and creates a code immediately
- Option B: Admin-triggered — `checkout()` only increments the counter; the admin calls `POST /admin/discount-codes/generate` when the condition is met

**Choice:** Admin-triggered

**Why:** The assignment explicitly calls for an admin API that "generates a discount code if the condition is satisfied", which implies a deliberate action rather than a side effect of checkout. Keeping code generation out of `checkout()` also keeps that function's responsibility narrow (place the order, nothing else) and makes the discount lifecycle independently observable and testable. The admin can verify the condition is met before issuing a code, which supports human oversight of the discount programme.

## Decision: Stock Validated at Checkout, Not at Add-to-Cart

**Context:** With a `stock` field on products, the system must decide when to enforce it — when an item is added to the cart or when the order is actually placed.

**Options Considered:**
- Option A: Validate at add-to-cart — reject `addItem` if stock would be exceeded
- Option B: Validate at checkout — allow any quantity into the cart; reject at order time if stock is insufficient

**Choice:** Validate at checkout

**Why:** Validating at add-to-cart creates a reservation problem: stock is neither decremented nor locked, so two users could both add the last item and both pass validation. The cart is a staging area, not a commitment. Checking stock at checkout — the point where the transaction is committed and stock is actually decremented — is the only place where the check is meaningful. This matches the behaviour of real e-commerce systems (items in a cart can go out of stock before purchase).

## Decision: Discount Business Rules Stored in Environment Config, Not in the Store

**Context:** `nthOrder` (how often a discount code is earned) and `discountPercentage` (how much off) need to live somewhere. The options were environment config (loaded at startup) or the in-memory store (mutable at runtime via an admin API).

**Options Considered:**
- Option A: Environment config (`NTH_ORDER`, `DISCOUNT_PERCENTAGE` in `.env`) — values are fixed for the lifetime of the process
- Option B: In-memory store — values seeded with defaults but changeable via an admin PATCH endpoint without a restart

**Choice:** Environment config

**Why:** `nthOrder` and `discountPercentage` are **business configuration** (how the system behaves), not **data** (what the system records). The assignment treats them as fixed rules, so placing them in the store would add an admin update endpoint, validation, and migration complexity for no current benefit. Config also makes changes deliberate — a restart is a conscious deployment decision rather than an accidental API call.

The migration path is straightforward if runtime mutability is ever needed: seed the store with the env defaults, add an admin `PATCH /admin/settings` endpoint, and replace the `config.nthOrder` references with `store.settings.nthOrder`. Nothing in the current design forecloses this.

## Decision: Validate-All-Then-Commit Pattern in Checkout

**Context:** Checkout modifies multiple pieces of state: decrements stock for each item, marks a discount code used, creates an order, and clears the cart. If validation of one item fails partway through, partially-applied state changes would leave the store inconsistent.

**Options Considered:**
- Option A: Interleave validate and mutate — decrement stock as each item is validated
- Option B: Validate everything first, then apply all mutations — no state is touched until all checks pass

**Choice:** Validate-all-then-commit

**Why:** The validate-then-commit pattern guarantees atomicity within a single request: either every check passes and every mutation is applied, or nothing is changed. This prevents partial orders (e.g. stock decremented for item 1, then 409 on item 2 — stock is now wrong without an order). In a real system this would be a database transaction; in the in-memory store it is achieved by running all validation in a first pass and all mutations in a second pass.
