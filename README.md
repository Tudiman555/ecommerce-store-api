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

---

## Running the Server

```bash
# Development (hot reload via tsx watch)
yarn dev

# Production (compile first, then run)
yarn build
yarn start
```

By default Server starts at: `http://localhost:3000`

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

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/cart/:userId/items` | Add a product to cart |
| `GET` | `/cart/:userId` | View current cart |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

---

## Project Structure

```
ecommerce-store-api/
├── src/
│   ├── config.ts               # Environment config (PORT)
│   ├── app.ts                  # Express app setup (middleware, routes)
│   ├── db/
│   │   └── index.ts            # In-memory store with getStore() / resetStore()
│   ├── models/
│   │   ├── cart.ts             # Cart and CartItem types
│   │   ├── discountCode.ts     # DiscountCode type
│   │   ├── order.ts            # Order type
│   │   └── product.ts          # Product type
│   ├── services/
│   │   └── cart.ts             # Cart business logic
│   ├── controllers/
│   │   └── cart.ts             # Cart request handlers (validate, call service, respond)
│   ├── schemas/
│   │   └── cart/
│   │       └── cart.ts         # Zod schemas for cart inputs
│   ├── routes/
│   │   ├── index.ts            # Central router (mounts sub-routers)
│   │   └── cart.ts             # Cart route definitions
│   ├── middlewares/
│   │   └── errorHandler.ts     # Global error handler + AppError class
│   └── utils/
│       └── logger.ts           # Structured JSON logger
├── tests/                      # Unit and integration tests
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
