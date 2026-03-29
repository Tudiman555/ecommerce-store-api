# CLAUDE.md — Ecommerce Store API

This file guides Claude Code on how to work in this repository.

---

## Project Overview

Express 5 + TypeScript REST API. Cart management, checkout with discount codes, admin reporting. In-memory storage only — no database.

---

## Tech Stack

- **Runtime**: Node.js 22+, CommonJS modules
- **Framework**: Express 5
- **Validation**: Zod (schemas live in `src/schemas/index.ts`)
- **Testing**: Vitest + supertest
- **Linting/Formatting**: Biome (`biome.json`)
- **Config**: dotenv → `src/config.ts`

---

## Architecture Rules

### Domain logic stays pure
All business logic lives in `src/domain/` as plain functions. They accept the store as a parameter — no imports of the store singleton, no Express dependencies. This makes them trivially unit-testable.

```
src/domain/cart.ts      — addItemToCart, getCart, clearCart
src/domain/order.ts     — placeOrder
src/domain/discount.ts  — generateCode, validateCode, isNthOrderThreshold, applyDiscount
```

### Routes are thin
Route handlers in `src/routes/` should only: validate input (via Zod middleware), call a domain function, return a response. No business logic in routes.

### Store is a module singleton
`src/store/index.ts` exports `getStore()` and `resetStore()`. Always use `resetStore()` in `beforeEach` in tests to ensure isolation. Never import the raw store object — always go through `getStore()`.

### Errors use AppError
Throw `new AppError('message', statusCode)` from domain functions or routes. The global error handler in `src/middleware/errorHandler.ts` catches it and returns `{ error: 'message' }` with the right status.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/config.ts` | All env vars — `nthOrder`, `discountPercent`, `port` |
| `src/schemas/index.ts` | All Zod schemas + inferred types — single source of truth |
| `src/store/index.ts` | In-memory state — products, carts, orders, discount codes |
| `src/app.ts` | Express app wiring — middleware, routes, swagger |
| `server.ts` | Entry point only — calls `app.listen` |

---

## Commands

```bash
npm run dev           # Start with hot reload (tsx watch)
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run check         # Lint + format (Biome)
npm run build         # Compile to dist/
```

---

## Coding Conventions

- **Quotes**: single quotes
- **Semicolons**: always
- **Trailing commas**: ES5 style
- **Indent**: 2 spaces
- **Line width**: 100 chars max
- Biome enforces all of the above — run `npm run check` before committing

---

## Testing Rules

- Unit tests go in `tests/domain/` — test pure functions directly, pass a fresh store
- Integration tests go in `tests/routes/` — use supertest against the Express app
- Always call `resetStore()` in `beforeEach` — never share state between tests
- Test file names mirror source: `src/domain/discount.ts` → `tests/domain/discount.test.ts`

---

## Discount System Logic

```
Every NTH_ORDER (default 5) completed orders → discount code becomes eligible
Admin calls POST /admin/discount-code to generate it
Code is for DISCOUNT_PCT% (default 10%) off
Code is single-use — marked used:true after checkout
Condition check: store.orderCounter % config.nthOrder === 0 AND orderCounter > 0
```

---

## Seeded Products

Five products are seeded into the store on startup (in `src/store/index.ts`). Tests can rely on these product IDs being available without setup.

---

## What NOT to do

- Don't add business logic to route handlers
- Don't import the store directly — use `getStore()`
- Don't use `any` type — strict mode is on
- Don't skip Zod validation on any endpoint that accepts a body
- Don't write nodemon config — `tsx watch` handles hot reload
