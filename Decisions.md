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

## Decision: Cart Add-Item Merges Quantity Instead of Rejecting Duplicates

**Context:** When a user adds a product that is already in their cart, the API must decide whether to treat it as an error, replace the quantity, or merge (add) the quantities.

**Options Considered:**
- Option A: Reject — return 409 if the product is already in the cart, force the client to use a separate update endpoint
- Option B: Replace — overwrite the existing quantity with the new value
- Option C: Merge — add the new quantity to the existing quantity

**Choice:** Merge quantities

**Why:** Matches the mental model of a real shopping cart — clicking "Add to cart" twice should give you 2 items, not an error. Rejecting forces unnecessary client complexity (check before add). Replacing is surprising and loses prior intent. Merging is the least-astonishing behavior and requires no extra endpoint. A dedicated "update quantity" endpoint can be added later if precise control is needed.

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

## Decision: Centralised Error Handling with AppError

**Context:** Domain functions need to signal HTTP errors (e.g. 404 product not found) without importing Express. Route handlers need a consistent way to return error responses.

**Options Considered:**
- Option A: Per-route try/catch — each handler catches errors and manually calls `res.status(...).json(...)` inline
- Option B: Custom error class + global handler — domain throws `AppError(message, statusCode)`, a single Express error handler middleware formats all error responses

**Choice:** `AppError` + global error handler

**Why:** Per-route error handling scatters the same `res.status().json()` pattern everywhere and makes it easy to miss a case. A global handler guarantees consistent error response shape (`{ error: message }`) across every endpoint. `AppError` carries a `statusCode` but has no Express dependency, so domain functions can throw it freely without coupling to the HTTP layer. Any unhandled error falls through to a generic 500, which is also handled in one place.
