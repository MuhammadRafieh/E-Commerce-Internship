# E-Commerce Internship

Full-stack e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js) featuring Stripe Checkout payments, JWT authentication, and a protected admin panel.

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Frontend    | React 18, Vite, TailwindCSS, Framer Motion      |
| Backend     | Node.js, Express, Mongoose                      |
| Database    | MongoDB (via Mongoose ODM)                      |
| Auth        | JWT (bcryptjs + jsonwebtoken)                   |
| Payments    | Stripe Checkout (INR currency)                  |
| Deployment  | Vercel (serverless + static SPA)                |

## Features

- **Home Page** — Hero section, category grid, featured products, animated Product Wheel
- **Shop / PLP** — Product listing with search, category/price/deals filters, sorting, pagination, grid/list toggle, mobile filter drawer
- **Product Detail / PDP** — Image, description, price (with discount display), quantity selector, add to cart, related products
- **Cart** — Client-side cart with localStorage persistence, quantity controls, remove items, price summary
- **Checkout & Payments** — Shipping form + Stripe Checkout redirect (INR), order creation on payment success
- **Auth** — Register / Login / Profile management, JWT with 7-day expiry, protected routes
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
NODE_ENV=development
```

> `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are optional. Without them, Stripe endpoints return a 503.

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
