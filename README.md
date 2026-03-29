# Ecommerce Store API

A RESTful backend API built with Node.js and TypeScript. Supports cart management, checkout with discount codes, and admin reporting.


## Features

- Add items to a session-based cart
- Checkout with optional discount code validation
- Automatic discount eligibility on every Nth order
- Admin API to generate discount codes and view store stats
- In-memory storage (no database required)
- Auto-generated API docs via Swagger UI


## Tech Stack

**Node.js 22+** : JavaScript runtime 
**TypeScript** : Static typing
**Express**: HTTP server and routing framework
**Zod**: Runtime request validation + TypeScript type inference from schemas
**dotenv** Loads environment variables from `.env` into `process.env`
**swagger-jsdoc** Generates OpenAPI spec from JSDoc comments in route files
**swagger-ui-express**  Serves an interactive API explorer at `/docs`
**tsx** Runs TypeScript directly without compiling — used for `npm run dev` hot reload |
**Vitest** Fast unit and integration test runner with native TypeScript support |
**supertest** Makes HTTP requests against the Express app in tests without starting a real server
**@vitest/coverage-v8** Code coverage reports using Node's built-in V8 engine |
**Biome** Linter + formatter(ESLint + Prettier). Written in Rust, very fast

---

## Prerequisites

- Node.js 22 or higher
- npm 10 or higher

---

## Setup

```bash
# Clone the repo
git clone <repo-url>
cd ecommerce-store

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
```

---

## Environment Variables

| `PORT` | `3000` | Port the server listens on |
| `NTH_ORDER` | `5` | Every Nth order makes a discount code eligible |
| `DISCOUNT_PCT` | `10` | Percentage discount applied when a code is redeemed |

---

## Running the Server

```bash
# Development (hot reload via tsx watch)
npm run dev

# Production (compile first, then run)
npm run build
npm start
```

Server starts at: `http://localhost:3000`

---

## API Docs

Interactive Swagger UI available at:

```
http://localhost:3000/docs
```

---

## Available Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output from `dist/` |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests and generate coverage report |
| `npm run lint` | Check code for lint errors |
| `npm run format` | Auto-format all source files |
| `npm run check` | Lint + format together (fix everything) |

---

## API Overview

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cart/:sessionId/items` | Add a product to cart |
| `GET` | `/cart/:sessionId` | View current cart |

### Checkout

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cart/:sessionId/checkout` | Place an order (optionally with discount code) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/discount-code` | Generate a discount code (only if Nth order threshold is met) |
| `GET` | `/admin/stats` | View total items sold, revenue, all discount codes, total savings given |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

---

## Discount System

- The store tracks a global order counter
- When `orderCount % NTH_ORDER === 0`, a discount code becomes eligible
- An admin calls `POST /admin/discount-code` to generate the code
- The generated code is for `DISCOUNT_PCT`% off
- Customers apply the code at checkout — it's validated and marked as used
- Each code can only be used once

---

## Project Structure

```
ecommerce-store/
├── src/
│   ├── config.ts           # Environment config (NTH_ORDER, DISCOUNT_PCT, PORT)
│   ├── app.ts              # Express app setup (routes, middleware wired together)
│   ├── store/
│   │   └── index.ts        # In-memory data store (products, carts, orders, codes)
│   ├── domain/
│   │   ├── cart.ts         # Pure functions: add item, get cart, clear cart
│   │   ├── order.ts        # Pure functions: place order, calculate totals
│   │   └── discount.ts     # Pure functions: generate code, validate code, apply discount
│   ├── schemas/
│   │   └── index.ts        # Zod schemas and inferred TypeScript types
│   ├── routes/
│   │   ├── cart.ts         # Cart route handlers
│   │   ├── checkout.ts     # Checkout route handler
│   │   └── admin.ts        # Admin route handlers
│   └── middleware/
│       ├── validate.ts     # Zod validation middleware factory
│       └── errorHandler.ts # Global Express error handler
├── tests/
│   ├── domain/             # Unit tests for pure domain functions
│   └── routes/             # Integration tests via supertest
├── server.ts               # Entry point — starts the HTTP server
├── .env.example            # Environment variable template
├── biome.json              # Biome linter/formatter config
├── tsconfig.json           # TypeScript compiler config
├── vitest.config.ts        # Vitest test runner config
└── DECISIONS.md            # Design decision log
```

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode during development
npm run test:watch

# With coverage
npm run test:coverage
```

---

## Design Decisions

See [DECISIONS.md](./DECISIONS.md) for documented trade-offs and architecture choices.
