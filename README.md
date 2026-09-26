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
| AI          | OpenAI / Gemini (optional, via REST)           |
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
- **AI Shopping Assistant** — Natural-language product search with real catalogue grounding
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

| Method | Endpoint      | Auth   | Description                          |
| ------ | ------------- | ------ | ------------------------------------ |
| POST   | `/ai/chat`    | Public | Natural-language product search      |

Body: `{ message, history? }` — `history` is prior turns (`role` + `content`) for
multi-turn context.

**How it stays accurate:** the assistant never invents products. Every reply is
grounded in a catalogue lookup that runs first — the matching real products are
retrieved from MongoDB and injected into the model's system prompt, and the
product links shown in the chat come from that database result rather than from
the model's text. If no key is configured, or the provider call fails, it falls
back to a deterministic templated reply and the response reports
`source: "rules"` instead of `"llm"`.

Understood intents: price ranges (`under`, `between X and Y`, `above`), category
(including synonyms such as "clothes" → `fashion`), `deals`/`discount`,
`in stock`, and sorting by cheapest, most expensive, best rated, most reviewed,
or newest. Category keywords are read from the `categories` collection, so
adding a category in the admin panel needs no code change.

Configure with `LLM_PROVIDER` (`openai` or `gemini`), `LLM_API_KEY`, and
optionally `LLM_MODEL` / `LLM_BASE_URL`. The key stays server-side.

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
- **Environment variables**: Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in Vercel dashboard

## Testing

A comprehensive E2E testing checklist covering responsiveness, functional flows, auth, API integration, and performance is available in the project documentation. Key areas:

- **Responsiveness**: Mobile (<640px), tablet, desktop — layout, touch targets, states
- **Cart**: localStorage persistence, quantity limits, badge sync
- **Auth**: JWT expiry, route protection, input validation
- **API**: CRUD error handling, edge cases (negative stock, missing fields)
- **Performance**: Loading skeletons, broken images, slow network behavior
