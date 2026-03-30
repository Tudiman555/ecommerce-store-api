# Ecommerce Store API

A RESTful backend API built with Node.js and TypeScript. Supports cart management, checkout with discount codes, and admin reporting.


## Tech Stack

| Package | Purpose |
|---------|---------|
| **Node.js 22+** | JavaScript runtime |
| **TypeScript** | Static typing |
| **Express** | HTTP server and routing framework |
| **Zod** | Runtime request validation + TypeScript type inference from schemas |
| **dotenv** | Loads environment variables from `.env` into `process.env` |
| **tsx** | Runs TypeScript directly without compiling — used for `yarn dev` hot reload |
| **Vitest** | Fast unit and integration test runner with native TypeScript support |
| **supertest** | Makes HTTP requests against the Express app in tests without starting a real server |
| **@vitest/coverage-v8** | Code coverage reports using Node's built-in V8 engine |
| **Biome** | Linter + formatter (replaces ESLint + Prettier). Written in Rust, very fast |
| **Husky** | Git hooks — enforces linting/formatting before commits |

---

## Prerequisites

- Node.js 22 or higher
- Yarn 1.22 or higher

---

## Setup

```bash
# Clone the repo
git clone <repo-url>
cd ecommerce-store-api

# Install dependencies
yarn install

# Copy environment config
cp .env.example .env
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `NTH_ORDER` | `5` | Every nth order makes a discount code available |
| `DISCOUNT_PERCENTAGE` | `10` | Percentage discount applied when a code is redeemed |

---

## Running the Server

```bash
# Development (hot reload via tsx watch)
yarn dev

# Production (compile first, then run)
yarn build
yarn start
```

By default the server starts at: `http://localhost:3000`

---

## Available Scripts

| Script | What it does |
|--------|-------------|
| `yarn dev` | Start server with hot reload (tsx watch) |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn start` | Run compiled output from `dist/` |
| `yarn test` | Run all tests once |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:coverage` | Run tests and generate coverage report |
| `yarn lint` | Check code for lint errors |
| `yarn format` | Auto-format all source files |
| `yarn check` | Lint + format together (fix everything) |

---

## API Overview

All routes (except `/health`) are prefixed with `/api/v1`.

### Cart

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/cart/:userId/items` | `{ productId, quantity }` | Add a product to cart (merges quantity if already present) |
| `GET` | `/api/v1/cart/:userId` | — | View current cart with enriched product details and total |

### Checkout

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/checkout/:userId` | `{ discountCode? }` | Place an order; optionally apply a discount code |

### Admin

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/admin/discount-codes/generate` | — | Generate a discount code if the nth-order condition is met |
| `GET` | `/api/v1/admin/stats` | — | View total orders, revenue, items purchased, and discounts given |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

---

## Discount System

The store rewards customers with discount codes based on order volume.

### How it works

```
Every NTH_ORDER orders placed → one discount code becomes available
Admin generates the code → shares it with a customer
Customer applies the code at checkout → DISCOUNT_PERCENTAGE% off their total
Code is single-use — once redeemed it cannot be used again
```

### Full flow

```
1. Customers place orders  →  store.orderCounter increments each time

2. Admin calls POST /api/v1/admin/discount-codes/generate
   - Computes: nextToClaimMilestone = lastClaimedMilestone + NTH_ORDER
   - Computes: latestMilestone = floor(orderCounter / NTH_ORDER) * NTH_ORDER
   - Eligible when: nextToClaimMilestone <= latestMilestone
   - If eligible: generates a code like SAVE-AB3KPQ7R, sets lastClaimedMilestone = nextToClaimMilestone
   - If not eligible: returns 400 with the order number needed to unlock the next code

3. Admin shares the code with a customer (out of band — email, dashboard, etc.)

4. Customer applies it at checkout:
   POST /api/v1/checkout/:userId  { "discountCode": "SAVE-AB3KPQ7R" }
   - discountAmount = subtotal × (DISCOUNT_PERCENTAGE / 100)
   - total = subtotal - discountAmount
   - Code is marked used immediately

5. Admin views stats at GET /api/v1/admin/stats
```

### Late generation and stacking — what if the admin misses milestones?

Missed milestones stack. Each call to the generate endpoint claims the **oldest unclaimed milestone first**. If the admin misses order #5 and #10, both codes can still be generated — one call at a time.

```
NTH_ORDER = 5

orderCounter=5,  lastClaimedMilestone=0  → nextToClaim=5,  latest=5   → eligible ✓ → lastClaimed=5
orderCounter=7,  lastClaimedMilestone=0  → nextToClaim=5,  latest=5   → eligible ✓ (late) → lastClaimed=5
orderCounter=12, lastClaimedMilestone=0  → nextToClaim=5,  latest=10  → eligible ✓ → lastClaimed=5
orderCounter=12, lastClaimedMilestone=5  → nextToClaim=10, latest=10  → eligible ✓ → lastClaimed=10
orderCounter=12, lastClaimedMilestone=10 → nextToClaim=15, latest=10  → NOT eligible (need order #15)
```

### Seeded data

The store starts with the following products:

| ID | Product | Price | Stock |
|----|---------|-------|-------|
| `p1` | Wireless Headphones | $79.99 | 50 |
| `p2` | Mechanical Keyboard | $129.99 | 30 |
| `p3` | USB-C Hub | $49.99 | 100 |
| `p4` | Webcam HD | $89.99 | 25 |
| `p5` | Desk Lamp | $34.99 | 75 |

And three users: `u1`, `u2` (regular), `u3` (admin).

---

## Project Structure

```
ecommerce-store-api/
├── src/
│   ├── config.ts               # Environment config (PORT, NTH_ORDER, DISCOUNT_PERCENTAGE)
│   ├── app.ts                  # Express app setup (middleware, routes)
│   ├── db/
│   │   └── index.ts            # In-memory store with getStore() / resetStore()
│   ├── models/
│   │   ├── cart.ts             # Cart and CartItem types
│   │   ├── discountCode.ts     # DiscountCode type
│   │   ├── order.ts            # Order and OrderItem types
│   │   ├── product.ts          # Product type (with stock)
│   │   └── user.ts             # User type and Role enum
│   ├── seeder/
│   │   ├── index.ts            # Re-exports seed data
│   │   ├── products.ts         # Seed products (p1–p5)
│   │   └── users.ts            # Seed users (u1–u3)
│   ├── services/
│   │   ├── cart.ts             # Cart business logic
│   │   ├── checkout.ts         # Checkout — validate, apply discount, create order
│   │   ├── discount.ts         # Discount code generation and validation
│   │   └── admin.ts            # Admin stats aggregation
│   ├── controllers/
│   │   ├── cart.ts             # Cart request handlers
│   │   ├── checkout.ts         # Checkout request handler
│   │   └── admin.ts            # Admin request handlers
│   ├── schemas/
│   │   ├── cart.ts             # Zod schemas for cart inputs
│   │   └── checkout.ts         # Zod schemas for checkout inputs
│   ├── routes/
│   │   ├── index.ts            # Central router (mounts sub-routers)
│   │   ├── cart.ts             # Cart route definitions
│   │   ├── checkout.ts         # Checkout route definitions
│   │   └── admin.ts            # Admin route definitions
│   ├── middlewares/
│   │   └── errorHandler.ts     # Global error handler + AppError class
│   └── utils/
│       └── logger.ts           # Structured JSON logger
├── tests/
│   ├── cart.test.ts            # Cart service unit tests
│   ├── checkout.test.ts        # Checkout service unit tests
│   └── discount.test.ts        # Discount service unit tests
├── server.ts                   # Entry point — starts the HTTP server
├── .env.example                # Environment variable template
├── biome.json                  # Biome linter/formatter config
├── tsconfig.json               # TypeScript compiler config
├── vitest.config.ts            # Vitest test runner config
└── Decisions.md                # Design decision log
```

---

## Running Tests

```bash
# Run all tests
yarn test

# Watch mode during development
yarn test:watch

# With coverage
yarn test:coverage
```

---

## Design Decisions

See [Decisions.md](./Decisions.md) for documented trade-offs and architecture choices.
