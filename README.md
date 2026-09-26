# E-Commerce Internship

Full-stack e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js) featuring Stripe Checkout payments, JWT authentication, and a protected admin panel.

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Frontend    | React 18, Vite, TailwindCSS, Framer Motion      |
| Backend     | Node.js, Express, Mongoose                      |
| Database    | MongoDB (via Mongoose ODM)                      |
| Auth        | JWT (bcryptjs + jsonwebtoken)                   |
| Email       | Nodemailer (password reset)                     |
| AI          | Local NLP engine (BM25 + intent parsing)       |
| Payments    | Stripe Checkout (INR currency)                  |
| Deployment  | Vercel (serverless + static SPA)                |

## Features

- **Home Page** — Hero section, category grid, featured products, animated Product Wheel
- **Shop / PLP** — Product listing with search, category/price/deals filters, sorting, pagination, grid/list toggle, mobile filter drawer
- **Product Detail / PDP** — Image, description, price (with discount display), quantity selector, add to cart, related products
- **Cart** — Client-side cart with localStorage persistence, quantity controls, remove items, price summary
- **Checkout & Payments** — Shipping form + Stripe Checkout redirect (INR), order creation on payment success
- **Auth** — Register / Login / Profile management, JWT with 7-day expiry, protected routes
- **Forgot Password** — Email a single-use reset link, set a new password
- **AI Shopping Assistant** — Local natural-language product search (BM25 + intent parsing, no external API)
- **Admin Panel** — Full CRUD for products and categories (admin only)
- **Responsive** — Mobile-first design, hamburger nav, touch-friendly targets, full desktop layout

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (optional — payment init is conditional)

### Installation

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Or manually:
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Environment Variables

Copy `.env.example` to `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=change_this_to_a_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional — password reset email. If unset, the reset link is
# printed to the backend console instead of being sent.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM=no-reply@yourdomain.com

NODE_ENV=development
```

> `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are optional. Without them, Stripe endpoints return a 503.
>
> `SMTP_*` is optional. Without it, `/auth/forgot-password` still works and prints the reset link to the server log — handy in development.
>
> `JWT_SECRET` is **required** when `NODE_ENV=production`. The server refuses to boot without it rather than fall back to a guessable signing key.

### Seed the Database

```bash
cd backend
npm run seed
```

This inserts 12 sample products and 6 categories into MongoDB.

### Run Development

```bash
# From root — runs backend (port 5000) + frontend (port 5173) concurrently
npm run dev
```

The Vite dev server proxies `/api/*` requests to `localhost:5000`.

## Available Scripts

### Root

| Script         | Description                              |
| -------------- | ---------------------------------------- |
| `npm run dev`  | Run backend + frontend concurrently      |
| `npm run build`| Build frontend for production            |
| `npm start`    | Run backend only                         |

### Backend (`cd backend`)

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start with auto-restart (watch)|
| `npm start`         | Start production server        |
| `npm run seed`      | Seed database with sample data |

### Frontend (`cd frontend`)

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start Vite dev server          |
| `npm run build`     | Build for production           |
| `npm run preview`   | Preview production build       |

## Project Structure

```
├── api/                  # Vercel serverless function
│   ├── index.js          #   Express wrapper for serverless
│   └── package.json
├── backend/              # Express API
│   ├── config/           #   DB, env, CORS, upload config
│   ├── controllers/      #   Route handlers
│   ├── middleware/        #   Auth, error handling, validation
│   ├── models/           #   Mongoose schemas (Product, User, Cart, Order, Category)
│   ├── routes/           #   Express routers
│   ├── utils/            #   AppError, generateToken
│   ├── server.js         #   Entry point
│   ├── seed.js / seed.json
│   └── .env
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── components/   #   Layout, common, UI, auth components
│   │   ├── context/      #   AuthContext, CartContext
│   │   ├── hooks/        #   Custom hooks
│   │   ├── pages/        #   15 page components
│   │   ├── routes/       #   AppRoutes
│   │   ├── services/     #   Axios API services
│   │   └── utils/        #   Constants, currency formatting
│   └── vite.config.js
├── vercel.json           # Deployment configuration
└── package.json          # Monorepo root
```

## API Overview

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint         | Auth     | Description          |
| ------ | ---------------- | -------- | -------------------- |
| POST   | `/auth/register` | Public   | Register new user    |
| POST   | `/auth/login`    | Public   | Login, returns JWT   |
| GET    | `/auth/profile`  | Protected| Get user profile     |
| PUT    | `/auth/profile`  | Protected| Update profile       |
| PUT    | `/auth/password` | Protected| Change password      |
| POST   | `/auth/forgot-password` | Public | Email a reset link |
| POST   | `/auth/reset-password/:token` | Public | Set a new password |

**Password reset:** tokens are 256-bit, stored only as a SHA-256 hash, expire after 1 hour, and are single-use. `forgot-password` returns an identical response whether or not the address exists, so it can't be used to discover registered emails.

**Session invalidation:** every JWT carries a `ver` claim matching the user's `tokenVersion`. Changing or resetting a password increments it, which immediately retires all tokens issued beforehand — so a stolen token stops working at once instead of remaining valid for the rest of its 7-day life. Tokens issued before this field existed are treated as `ver: 0` and keep working.

### Products
| Method | Endpoint              | Auth     | Description                |
| ------ | --------------------- | -------- | -------------------------- |
| GET    | `/products`           | Public   | List (paginated, filtered) |
| GET    | `/products/:id`       | Public   | Single product             |
| POST   | `/products`           | Admin    | Create product             |
| PUT    | `/products/:id`       | Admin    | Update product             |
| DELETE | `/products/:id`       | Admin    | Delete product             |

**Query params for GET /products:** `search`, `category`, `minPrice`, `maxPrice`, `sort`, `deals`, `page`, `limit`

### Categories, Cart, Orders, Payments
See route files in `backend/routes/` for full endpoint listings.

### AI Assistant

| Method | Endpoint      | Auth   | Description                       |
| ------ | ------------- | ------ | --------------------------------- |
| POST   | `/ai/chat`    | Public | Natural-language product search   |
| GET    | `/ai/health`  | Public | Engine status and index size      |

Body: `{ message, previous? }` — `previous` is the last assistant turn's
`products`, used to interpret refinements like "cheaper" or "something else".

**Runs entirely locally.** There is no language model and no external API — no
key, no network call, no cost. A request is handled in four stages:

1. **Understand** (`utils/nlp/understand.js`) — intent and entity extraction:
   price ranges, category, discount, stock, sort order, and product keywords.
   Spans already interpreted as price or intent are masked out of the text, so
   the leftovers are genuinely just the words being searched for.
2. **Retrieve** (`utils/nlp/engine.js`) — filter the catalogue by the hard
   constraints (category, price, stock, discount), then rank with **BM25**
   (`utils/nlp/bm25.js`) so a title match outranks a description match and rare
   terms count for more.
3. **Correct** — query terms are fuzzy-matched against the catalogue vocabulary,
   so `wireles headphons` still finds the headphones. Corrections are reported
   back to the UI rather than applied silently.
4. **Respond** (`utils/nlp/respond.js`) — compose the reply from what was
   actually found.

**Why it cannot hallucinate:** there is no generative step. Every product name,
price, discount, and rating in a reply comes from a database row, and the links
rendered in the chat are that same query result. If nothing matches, it says so
and widens the search explicitly rather than inventing a plausible answer.

**Trade-off:** replies are templated, so phrasing is predictable and repeats
across similar questions. It handles the shopping domain well; it is not a
general-purpose conversational model.

Understood: category (with synonyms and prefix matching, so `cloths` resolves to
`fashion`), price (`under`, `between X and Y`, `above`), `deals`, `in stock`,
colour/material/brand attributes, sorting by cheapest / most expensive / best
rated / most reviewed / newest, and gift framing (`gift for my dad under 2000`,
where the recipient is understood as context rather than a product keyword).

Adding vocabulary — a category synonym, an attribute, a brand — is a single line
in `utils/nlp/ontology.js`. Categories themselves are **not** listed there: they
are read from the database at query time, so a category added through the admin
panel is understood immediately with no code change.

### Testing the assistant

```bash
cd backend
npm run test:ai
```

Checks that every product is reachable through the phrasings a shopper would
actually type, and prints any probe that fails so a vocabulary gap is visible
rather than guessed at. It exits non-zero if a product cannot be found at all.

### When nothing matches

The reply names what was actually missing, rather than the first thing it
thinks of:

| Query | Reply |
| --- | --- |
| `waterproof jacket` | "I don't stock "jacket". Here is the closest we have in the store." |
| `gold necklace` | "Nothing here matches "gold"." |
| `running shoes` | "I don't stock "running" or "shoes"." |
| `newest arrivals` | Browses, sorted — "arrivals" was treated as a stray noun, not a product |

A request for a colour or material the catalogue does not document returns
nothing rather than guessing, which is the intended trade-off: no product in the
store records a material, so asking for a "gold necklace" will not match one.

## Admin Access

The admin panel is at `/admin` and requires a user account with the `admin` role.

Seed the database first, then promote an account you own:

```bash
# In mongosh / Atlas Data Explorer, on the ecommerce database:
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin" } }
)
```

Do not commit real credentials — admin accounts are created locally and seeded
only in your own database.

## Deployment (Vercel)

The project is configured for Vercel deployment via `vercel.json`:

- **API**: The `api/` directory is deployed as a serverless function handling `/api/*`
- **Frontend**: Built as a static SPA (`frontend/dist`), all non-API routes fall back to `index.html`

### Environment variables

Set these in the Vercel dashboard:

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGO_URI` | Yes | Atlas connection string |
| `JWT_SECRET` | Yes | Server refuses to boot in production without it |
| `CLIENT_URL` | Yes | Your deployed origin, used for CORS and reset links |
| `UPSTASH_REDIS_REST_URL` | Yes | Shared rate-limit counters — see below |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | No | Stripe endpoints return 503 without them |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | No | Without them, reset links print to the function log |

### Rate limiting on serverless

`express-rate-limit` counts in process memory by default. On Vercel every cold
start gets a fresh instance, so the limit is effectively **not applied** — an
attacker can cycle through login and password-reset by forcing cold starts.
Setting the two `UPSTASH_REDIS_*` variables switches the limiters to shared
Redis counters over HTTP, which needs no TCP connection from a lambda.

If Redis becomes unreachable the limiters **fail open** (requests are allowed
without counting). That is deliberate: a Redis outage must not lock every
customer out of signing in. Losing throttling briefly is a far smaller problem
than a total login outage. `GET /api/ai/health` reports the active backend as
`in-memory`, `upstash`, or `upstash(degraded)`.

### Known limitation: image uploads

`POST /api/upload` writes to `backend/uploads/`, but the serverless filesystem
is read-only outside `/tmp`, so **uploaded images will not persist on Vercel**.
Point multer at object storage (S3, Cloudinary, Vercel Blob) before relying on
uploads in production.

### Verifying the deployment surface

```bash
cd backend
npm run verify:deploy
```

Asserts that `api/index.js` mounts every route `backend/server.js` does, and
that the serverless bundle can be imported. The AI assistant, admin panel,
coupons and uploads were all mounted only locally at one point, which is
exactly the class of bug this catches.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request:

- installs all four workspaces
- `verify:deploy` — route parity and serverless import check
- `test:ai` — assistant coverage against a MongoDB service container
- `npm run build` — frontend production build
- a credential-shape scan that fails if a key-shaped string is committed
  (lockfiles and `.env.example` are excluded; verified against known key
  formats so it does not fire on placeholders)

## Testing

A comprehensive E2E testing checklist covering responsiveness, functional flows, auth, API integration, and performance is available in the project documentation. Key areas:

- **Responsiveness**: Mobile (<640px), tablet, desktop — layout, touch targets, states
- **Cart**: localStorage persistence, quantity limits, badge sync
- **Auth**: JWT expiry, route protection, input validation
- **API**: CRUD error handling, edge cases (negative stock, missing fields)
- **Performance**: Loading skeletons, broken images, slow network behavior
