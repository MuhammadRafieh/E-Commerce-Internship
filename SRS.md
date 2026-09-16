# Software Requirements Specification (SRS)

## E-Commerce Web Application

**Version:** 1.0  
**Date:** July 6, 2026  
**Prepared for:** E-Commerce Internship Project

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Document Conventions
   - 1.3 Intended Audience
   - 1.4 Product Scope
   - 1.5 References
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Characteristics
   - 2.4 Assumptions and Dependencies
3. [System Architecture](#3-system-architecture)
   - 3.1 High-Level Architecture
   - 3.2 Technology Stack
   - 3.3 Directory Structure
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 User Authentication & Profile
   - 4.2 Product Catalog & Browsing
   - 4.3 Shopping Cart
   - 4.4 Checkout & Payment
   - 4.5 Order Management
   - 4.6 Admin Product Management
   - 4.7 Admin Order Management
   - 4.8 Admin Sales Analytics
   - 4.9 Category Management
   - 4.10 Coupon System
   - 4.11 AI-Powered Features
   - 4.12 Wishlist
5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 Performance
   - 5.2 Security
   - 5.3 Usability
   - 5.4 Reliability
   - 5.5 Scalability
6. [External Interface Requirements](#6-external-interface-requirements)
   - 6.1 User Interfaces
   - 6.2 Hardware Interfaces
   - 6.3 Software Interfaces
   - 6.4 Communication Interfaces
7. [Data Model](#7-data-model)
   - 7.1 Entity Relationship Diagram
   - 7.2 Schema Definitions
8. [API Endpoints](#8-api-endpoints)
9. [Glossary](#9-glossary)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) describes the complete functional and non-functional requirements for the E-Commerce Web Application. It serves as a reference for developers, testers, and stakeholders to understand the system's capabilities, architecture, and constraints.

### 1.2 Document Conventions

| Convention | Meaning |
|---|---|
| `MUST` | Absolute requirement |
| `SHOULD` | Recommended but not mandatory |
| `MAY` | Optional feature |
| `REQ-N` | Functional requirement identifier |

### 1.3 Intended Audience

- Development team
- Quality assurance / testers
- Project stakeholders
- Future maintainers

### 1.4 Product Scope

The system is a full-stack e-commerce platform supporting:

- **Customer-facing:** Product browsing, search, cart management, checkout (Stripe / COD), order tracking, user accounts, wishlist
- **Admin-facing:** Product CRUD, order management with status tracking, sales analytics dashboard, category management, coupon management
- **Guest checkout:** Users can purchase without creating an account

The application is built as a monorepo with a React (Vite) frontend and Express.js (Node.js) backend, using MongoDB for data persistence.

### 1.5 References

- React 18 Documentation: https://react.dev
- Express.js Documentation: https://expressjs.com
- MongoDB Manual: https://www.mongodb.com/docs
- Mongoose Documentation: https://mongoosejs.com
- Stripe API: https://stripe.com/docs/api
- Recharts Documentation: https://recharts.org
- Tailwind CSS: https://tailwindcss.com

---

## 2. Overall Description

### 2.1 Product Perspective

The system is a new, standalone e-commerce application. It replaces no existing system. It is designed for a single online store with one admin and multiple customers.

**System Context:**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Customer   │◄────►│  React App   │◄────►│  Express API │◄────►│  MongoDB     │
│   (Browser)  │      │  (Vite/SPA)  │      │  (Node.js)   │      │  (Database)  │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │   Stripe     │
                                            │  (Payments)  │
                                            └──────────────┘
```

### 2.2 Product Functions

| Function Area | Description |
|---|---|
| User Management | Registration, login, profile updates, password changes, role-based access (user/admin) |
| Product Catalog | Browse with grid/list views, search (text index), category filter, price sort, pagination |
| Product Details | Image gallery, ratings, stock info, recommended products, quantity selector |
| Shopping Cart | Add/remove items, quantity adjust, coupon application, price calculation |
| Checkout | Shipping form, payment method selection (Stripe or COD), guest checkout |
| Order Management | Order creation, status tracking (ordered → confirmed → dispatched → arrived → assigned → delivered), order history |
| Admin Products | Full CRUD with multi-image upload, stock editing, category assignment |
| Admin Orders | View all orders, update status, mark as paid, search/filter |
| Admin Sales | Dashboard with KPI metrics, revenue charts, category pie chart, top products, recent orders |
| Categories | CRUD for product categories with images |
| Coupons | Percentage-based discounts with expiry dates |
| Wishlist | Add/remove products to personal wishlist |
| AI Integration | AI-powered product recommendations using Google Gemini |

### 2.3 User Characteristics

| User Type | Description | Privileges |
|---|---|---|
| Guest | Unauthenticated visitor | Browse products, add to cart, guest checkout |
| Registered User | Logged-in customer | All guest features + order history, profile, wishlist, standard checkout |
| Admin | Store administrator | All user features + product/category/order/coupon management, sales analytics |

### 2.4 Assumptions and Dependencies

**Assumptions:**
- MongoDB is installed and running locally
- Node.js v18+ is available
- Stripe account with API keys for payment processing
- Google Gemini API key for AI recommendations
- Redis (optional) for caching — falls back gracefully

**Dependencies:**
- `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `stripe`, `cors`, `cookie-parser`
- `react`, `react-router-dom`, `recharts`, `react-hot-toast`, `framer-motion`
- `@google/generative-ai` for AI features
- `multer` for file uploads
- `express-async-errors` for error handling

---

## 3. System Architecture

### 3.1 High-Level Architecture

**Three-Tier Architecture:**
1. **Presentation Layer:** React SPA served by Vite, communicates via REST API
2. **Application Layer:** Express.js server with route-controller-model pattern
3. **Data Layer:** MongoDB with Mongoose ODM

**Authentication Flow:**
- JWT stored in HttpOnly cookie (set on login)
- `protect` middleware verifies token on protected routes
- `adminOnly` middleware checks user role

### 3.2 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| Animation | Framer Motion | 11.x |
| Backend Runtime | Node.js | 18+ |
| Backend Framework | Express.js | 4.x |
| Database | MongoDB | 7.x |
| ODM | Mongoose | 8.x |
| Authentication | JWT (jsonwebtoken) | — |
| Payment | Stripe SDK | — |
| AI | Google Generative AI | — |
| File Upload | Multer | 1.x |
| Toast Notifications | react-hot-toast | 2.x |

### 3.3 Directory Structure

```
backend/
├── config/            # DB, CORS, env, upload config
├── controllers/       # Route handler logic
├── middleware/        # Auth, error handling, caching, rate limiting, validation
├── models/           # Mongoose schemas (User, Product, Order, Category, Coupon)
├── routes/           # Express route definitions
├── scripts/          # Utility scripts
├── uploads/          # Uploaded file storage
├── utils/            # Helpers (e.g., generateToken)
├── seed.js           # Database seed script
├── seed.json         # Seed data
└── server.js         # Entry point

frontend/
├── public/           # Static assets
├── src/
│   ├── components/
│   │   ├── admin/       # Admin analytics component
│   │   ├── auth/        # ProtectedRoute wrapper
│   │   ├── common/      # Shared components (ProductCard, CartDrawer, OrderTracker, etc.)
│   │   ├── layout/      # Layout, Navbar, Footer
│   │   └── ui/          # Reusable UI (StarRating, QuantitySelector, Icons)
│   ├── context/         # React contexts (Cart, Wishlist, Auth)
│   ├── pages/           # Route-level page components
│   ├── routes/          # Route definitions
│   ├── services/        # API client functions
│   └── utils/           # Currency formatting, helpers
└── vite.config.js
```

---

## 4. Functional Requirements

### 4.1 User Authentication & Profile

**REQ-AUTH-1:** Users MUST be able to register with name, email, and password.  
**REQ-AUTH-2:** Users MUST be able to login with email and password.  
**REQ-AUTH-3:** Users MUST be able to logout, clearing the JWT cookie.  
**REQ-AUTH-4:** Authenticated users MUST be able to view and update their profile.  
**REQ-AUTH-5:** Authenticated users MUST be able to change their password.  
**REQ-AUTH-6:** Login attempts MUST be rate-limited (5 per minute).  
**REQ-AUTH-7:** Passwords MUST be hashed with bcryptjs (12 salt rounds).  
**REQ-AUTH-8:** Tokens MUST expire after the configured period (default 7 days).  
**REQ-AUTH-9:** Admin users MUST be distinguished by a `role` field in the JWT payload.

### 4.2 Product Catalog & Browsing

**REQ-PROD-1:** Products MUST display in a responsive grid (2-4 columns).  
**REQ-PROD-2:** Users MUST be able to switch between grid and list view.  
**REQ-PROD-3:** Users MUST be able to search products by name or category (full-text search).  
**REQ-PROD-4:** Users MUST be able to filter by category.  
**REQ-PROD-5:** Users MUST be able to sort by price, name, rating, and date.  
**REQ-PROD-6:** Products MUST paginate with configurable page size (default 12).  
**REQ-PROD-7:** Each product card MUST show image, name, price, rating, and discount badge.  
**REQ-PROD-8:** "Deals" mode MUST filter products that have a discount (`originalPrice` exists).  
**REQ-PROD-9:** Out-of-stock products MUST show an overlay on the card.  
**REQ-PROD-10:** Product detail page MUST show a multi-image gallery, description, price, stock, and rating.  
**REQ-PROD-11:** Recommended products MUST appear on the detail page (by category, tags, or price range).  
**REQ-PROD-12:** Products MAY be displayed in an animated carousel wheel on the home page.  
**REQ-PROD-13:** Featured products section SHOULD show on the home page.

### 4.3 Shopping Cart

**REQ-CART-1:** Users (guest or logged-in) MUST be able to add products to cart.  
**REQ-CART-2:** Cart MUST persist in localStorage across sessions.  
**REQ-CART-3:** Users MUST be able to adjust item quantities.  
**REQ-CART-4:** Users MUST be able to remove items.  
**REQ-CART-5:** Cart MUST display subtotal, total items count.  
**REQ-CART-6:** A floating cart drawer MUST show cart contents from any page.  
**REQ-CART-7:** Coupon codes MUST be applicable in the cart (percentage discount).  
**REQ-CART-8:** Cart data MUST be sanitized (prices coerced to numbers, filtered for validity).  
**REQ-CART-9:** A version key MUST be used to force-reset stale/corrupted localStorage cart data.

### 4.4 Checkout & Payment

**REQ-CHECK-1:** Authenticated users MUST provide shipping address during checkout.  
**REQ-CHECK-2:** Guest users MUST provide email and shipping address.  
**REQ-CHECK-3:** Users MUST choose between Stripe (card) and Cash on Delivery.  
**REQ-CHECK-4:** Stripe Payment Element MUST be integrated for card entry.  
**REQ-CHECK-5:** Orders MUST only be created after successful Stripe payment or on form submit for COD.  
**REQ-CHECK-6:** A success page MUST display order confirmation after checkout.  
**REQ-CHECK-7:** Order ID MUST be returned and displayed to the user.

### 4.5 Order Management

**REQ-ORD-1:** Users MUST see their order history on the profile page.  
**REQ-ORD-2:** Each order MUST track status through discrete steps: `ordered → confirmed → dispatched → arrived_at_city → assigned_to_rider → delivered`.  
**REQ-ORD-3:** Status changes MUST be recorded with timestamps in a `statusHistory` array.  
**REQ-ORD-4:** The UI MUST display an order tracker component showing current progress.  
**REQ-ORD-5:** Users MUST see order details including items, prices, shipping, and payment info.  
**REQ-ORD-6:** Orders MUST include `isPaid` and `isDelivered` flags.

### 4.6 Admin Product Management

**REQ-ADMIN-PROD-1:** Admin MUST be able to create products with name, price, description, category, stock, and images.  
**REQ-ADMIN-PROD-2:** Admin MUST be able to upload multiple images per product (primary + additional).  
**REQ-ADMIN-PROD-3:** Admin MUST be able to edit all product fields.  
**REQ-ADMIN-PROD-4:** Admin MUST be able to delete products.  
**REQ-ADMIN-PROD-5:** Admin MUST be able to edit stock inline.  
**REQ-ADMIN-PROD-6:** Admin MUST be able to search products in the management table.  
**REQ-ADMIN-PROD-7:** Admin MUST see paginated product listings (10 per page).  
**REQ-ADMIN-PROD-8:** Admin MUST be able to set an original price for discount display.  
**REQ-ADMIN-PROD-9:** Admin MUST be able to assign categories from existing or create new ones inline.

### 4.7 Admin Order Management

**REQ-ADMIN-ORD-1:** Admin MUST see all orders sorted by creation date.  
**REQ-ADMIN-ORD-2:** Admin MUST be able to filter orders by paid/unpaid/delivered/pending status.  
**REQ-ADMIN-ORD-3:** Admin MUST be able to search orders by ID, customer name, or email.  
**REQ-ADMIN-ORD-4:** Admin MUST be able to update order status through the defined workflow.  
**REQ-ADMIN-ORD-5:** Admin MUST be able to mark unpaid orders as paid.  
**REQ-ADMIN-ORD-6:** When confirming an order (`confirmed` status), product stock MUST be deducted atomically.  
**REQ-ADMIN-ORD-7:** Stock deduction MUST check for sufficient inventory and fail with a clear message if insufficient.  
**REQ-ADMIN-ORD-8:** When marking as delivered, the `isDelivered` flag and `deliveredAt` timestamp MUST be set.

### 4.8 Admin Sales Analytics

**REQ-ADMIN-SA-1:** The sales dashboard MUST display 4 KPI cards: Total Revenue, Total Orders, Average Order Value, Items Sold.  
**REQ-ADMIN-SA-2:** Each KPI MUST show period-over-period growth (last 30 days vs previous 30 days).  
**REQ-ADMIN-SA-3:** A revenue trend chart (AreaChart) MUST show daily revenue and order count over the last 30 days.  
**REQ-ADMIN-SA-4:** A category performance chart (PieChart) MUST show revenue distribution by category.  
**REQ-ADMIN-SA-5:** A top 5 products leaderboard MUST show best-selling products by revenue.  
**REQ-ADMIN-SA-6:** A recent orders table MUST show the latest 50 orders.  
**REQ-ADMIN-SA-7:** All charts MUST show skeleton loading states while data is loading.  
**REQ-ADMIN-SA-8:** Error state with retry button MUST be shown on API failure.  
**REQ-ADMIN-SA-9:** Empty state MUST be shown when no paid orders exist (with helpful message about marking orders paid).

### 4.9 Category Management

**REQ-CAT-1:** Admin MUST be able to create categories with a name and image.  
**REQ-CAT-2:** Admin MUST be able to edit existing categories.  
**REQ-CAT-3:** Admin MUST be able to delete categories.  
**REQ-CAT-4:** Categories MUST display as a grid of image cards on the admin dashboard.  
**REQ-CAT-5:** Categories SHOULD display on the home page for browsing.

### 4.10 Coupon System

**REQ-COUPON-1:** Coupons MUST have a code, discount percentage, and expiry date.  
**REQ-COUPON-2:** Coupon codes MUST be unique.  
**REQ-COUPON-3:** Expired coupons MUST be rejected.  
**REQ-COUPON-4:** The discount MUST apply as a percentage reduction in the cart.

### 4.11 AI-Powered Features

**REQ-AI-1:** Product recommendations MAY be enhanced using Google Gemini AI.  
**REQ-AI-2:** The AI endpoint MUST accept product data and return recommendations.  
**REQ-AI-3:** The AI service MUST handle errors gracefully (fall back to standard recommendations if unavailable).

### 4.12 Wishlist

**REQ-WISH-1:** Registered users MUST be able to add products to their wishlist.  
**REQ-WISH-2:** Registered users MUST be able to remove products from their wishlist.  
**REQ-WISH-3:** Wishlist MUST persist in localStorage.  
**REQ-WISH-4:** Products in wishlist MUST be visually indicated on product cards.

---

## 5. Non-Functional Requirements

### 5.1 Performance

**REQ-NF-PERF-1:** Page load time SHOULD be under 2 seconds on a standard broadband connection.  
**REQ-NF-PERF-2:** API response time for product listing SHOULD be under 500ms.  
**REQ-NF-PERF-3:** Product search results SHOULD appear within 300ms of user input.  
**REQ-NF-PERF-4:** The frontend build SHOULD be optimized (lazy loading for large pages).  
**REQ-NF-PERF-5:** Redis caching MAY be used for product listing responses.  
**REQ-NF-PERF-6:** Images SHOULD be optimized (proper sizing, lazy loading with `loading="lazy"`).  
**REQ-NF-PERF-7:** MongoDB queries SHOULD use appropriate indexes (text index on name/category, index on price, index on category).

### 5.2 Security

**REQ-NF-SEC-1:** Passwords MUST be hashed using bcryptjs with 12 salt rounds.  
**REQ-NF-SEC-2:** JWT tokens MUST be stored in HttpOnly, Secure, SameSite cookies.  
**REQ-NF-SEC-3:** All admin routes MUST be protected by both `protect` and `adminOnly` middleware.  
**REQ-NF-SEC-4:** User-specific routes MUST verify ownership (users can only access their own data).  
**REQ-NF-SEC-5:** Rate limiting MUST be applied to auth endpoints (5 requests/minute).  
**REQ-NF-SEC-6:** File uploads MUST be restricted to image types only (5MB max).  
**REQ-NF-SEC-7:** CORS MUST be configured to allow only the frontend origin.  
**REQ-NF-SEC-8:** Environment variables MUST be used for secrets (JWT_SECRET, API keys, DB URI).  
**REQ-NF-SEC-9:** Input validation MUST be performed on all write operations.  
**REQ-NF-SEC-10:** Stripe webhook signature MUST be verified for payment events.

### 5.3 Usability

**REQ-NF-UI-1:** The UI MUST be responsive (mobile, tablet, desktop).  
**REQ-NF-UI-2:** Loading states MUST be shown as skeleton placeholders or spinners.  
**REQ-NF-UI-3:** Error states MUST show user-friendly messages with retry options.  
**REQ-NF-UI-4:** Empty states MUST show helpful illustrations and messages.  
**REQ-NF-UI-5:** Toast notifications MUST confirm user actions (add to cart, order placed, etc.).  
**REQ-NF-UI-6:** Navigation MUST be intuitive with breadcrumbs and clear CTAs.  
**REQ-NF-UI-7:** All currency values MUST display in Indian Rupees (Rs) format.  
**REQ-NF-UI-8:** Hover and active states MUST provide visual feedback on interactive elements.  
**REQ-NF-UI-9:** Flash messages (success/error) MUST auto-dismiss after 3 seconds.

### 5.4 Reliability

**REQ-NF-REL-1:** The system MUST handle database connection failures gracefully.  
**REQ-NF-REL-2:** API errors MUST return consistent JSON error responses with appropriate HTTP status codes.  
**REQ-NF-REL-3:** The frontend MUST handle API failures without crashing (error boundaries or catch blocks).  
**REQ-NF-REL-4:** Redis caching MUST degrade gracefully when Redis is unavailable.  
**REQ-NF-REL-5:** Stock levels MUST be accurate (prevent overselling via confirmation-time deduction).  
**REQ-NF-REL-6:** Cart data MUST survive page refreshes and browser restarts (localStorage).

### 5.5 Scalability

**REQ-NF-SCAL-1:** The API SHOULD be stateless to allow horizontal scaling.  
**REQ-NF-SCAL-2:** MongoDB indexes SHOULD support efficient queries as data grows.  
**REQ-NF-SCAL-3:** Pagination MUST be used for product listings and order tables.  
**REQ-NF-SCAL-4:** Product data MAY be cached in Redis for high-traffic scenarios.

---

## 6. External Interface Requirements

### 6.1 User Interfaces

The application MUST render in modern web browsers (Chrome, Firefox, Safari, Edge — last 2 major versions).

**Key Pages:**

| Route | Page | Access |
|---|---|---|
| `/` | Home — hero, featured products, categories, deals | Public |
| `/shop` | Product catalog with search/filter/sort | Public |
| `/product/:id` | Product detail with gallery | Public |
| `/cart` | Shopping cart | Public |
| `/checkout` | Checkout with shipping + payment | Public |
| `/login` | Login form | Public |
| `/register` | Registration form | Public |
| `/about` | About page | Public |
| `/contact` | Contact page | Public |
| `/faqs` | FAQ page | Public |
| `/profile` | User profile | Auth required |
| `/orders` | User order history | Auth required |
| `/order-success` | Order confirmation | Public |
| `/admin` | Admin product management | Admin only |
| `/admin/orders` | Admin order management | Admin only |
| `/admin/sales` | Admin sales analytics | Admin only |

### 6.2 Hardware Interfaces

- **Server:** Standard x86/x64 machine, minimum 1GB RAM, 10GB storage
- **Client:** Any device with a modern web browser and internet connection

### 6.3 Software Interfaces

| External System | Interface Type | Purpose |
|---|---|---|
| MongoDB | Native driver via Mongoose ODM | Data persistence |
| Stripe | REST API via `stripe` npm package | Payment processing |
| Google Gemini | REST API via `@google/generative-ai` | AI recommendations |
| Redis (optional) | `ioredis` client | API response caching |
| File System | `multer` middleware | Image uploads |

### 6.4 Communication Interfaces

- **Frontend ↔ Backend:** REST over HTTP/HTTPS, JSON payloads
- **Backend ↔ MongoDB:** MongoDB Wire Protocol (default port 27017)
- **Backend ↔ Stripe:** HTTPS REST API
- **Backend ↔ Google AI:** HTTPS gRPC/REST API
- **Stripe Webhook:** HTTP POST from Stripe to `/api/webhook`

---

## 7. Data Model

### 7.1 Entity Relationship Diagram (Textual)

```
User ────< Order          (one user has many orders)
User ────< Wishlist        (one user has many wishlist items)
Order ────< OrderItem     (one order has many items)
OrderItem ──── Product     (each item references a product)
Product ──── Category      (each product has a category string)
Coupon    (standalone, referenced by code)
Category  (standalone, with name, slug, image)
```

### 7.2 Schema Definitions

#### User
| Field | Type | Constraints |
|---|---|---|
| name | String | Required |
| email | String | Required, unique, lowercase |
| password | String | Required, min 6 chars, bcrypt hashed |
| role | String | enum: user/admin, default: user |
| phone | String | Optional |

#### Product
| Field | Type | Constraints |
|---|---|---|
| name | String | Required, max 200 chars, trimmed |
| price | Number | Required, min 0 |
| description | String | Required, max 2000 chars |
| category | String | Required, lowercase, trimmed |
| stock | Number | Required, min 0, default 0 |
| image | String | Required (primary image URL) |
| images | [String] | Array of URLs, default [] |
| originalPrice | Number | Optional, min 0 (for discount display) |
| rating | Number | default 0, min 0, max 5 |
| numReviews | Number | default 0, min 0 |
| tags | [String] | default [] |

Indexes: `{ name: 'text', category: 'text' }`, `{ price: 1 }`, `{ category: 1 }`

#### Order
| Field | Type | Constraints |
|---|---|---|
| user | ObjectId (ref: User) | Nullable (guest orders) |
| guestEmail | String | Nullable |
| items | [OrderItem] | Array of { product (ref), name, price, quantity, image } |
| shippingAddress | { fullName, address, city, postalCode, country } | — |
| paymentMethod | String | default: 'stripe' |
| itemsPrice | Number | Required |
| shippingPrice | Number | Required |
| discount | Number | default: 0 |
| totalPrice | Number | Required |
| isPaid | Boolean | default: false |
| paidAt | Date | — |
| isDelivered | Boolean | default: false |
| deliveredAt | Date | — |
| status | String | enum: ordered, confirmed, dispatched, arrived_at_city, assigned_to_rider, delivered |
| statusHistory | [{ status, note, timestamp }] | — |

#### Category
| Field | Type | Constraints |
|---|---|---|
| name | String | Required, unique |
| slug | String | Required, unique |
| image | String | Required |

#### Coupon
| Field | Type | Constraints |
|---|---|---|
| code | String | Required, unique, uppercase, trimmed |
| discount | Number | Required, min 0, max 100 (percentage) |
| expiresAt | Date | Required |

---

## 8. API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Public | Logout (clear cookie) |
| GET | `/api/auth/profile` | Protect | Get user profile |
| PUT | `/api/auth/profile` | Protect | Update profile |
| PUT | `/api/auth/password` | Protect | Change password |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List products (search, filter, sort, paginate) |
| GET | `/api/products/:id` | Public | Get product by ID |
| GET | `/api/products/:id/recommendations` | Public | Get product recommendations |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/cart/validate-coupon` | Public | Validate a coupon code |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Protect | Create order (logged-in) |
| POST | `/api/orders/guest` | Public | Create guest order |
| GET | `/api/orders/mine` | Protect | Get user's orders |
| GET | `/api/orders` | Admin | Get all orders |
| GET | `/api/orders/:id` | Protect | Get order by ID (owner or admin) |
| PUT | `/api/orders/:id/pay` | Admin | Mark order as paid |
| PUT | `/api/orders/:id` | Admin | Update order status |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/sales-analytics` | Admin | Get sales dashboard data |

### Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | Public | List all categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

### Coupons

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/coupons` | Admin | List coupons |
| POST | `/api/coupons` | Admin | Create coupon |
| DELETE | `/api/coupons/:id` | Admin | Delete coupon |

### Uploads

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | Admin | Upload image file |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/create-payment-intent` | Public | Create Stripe payment intent |
| POST | `/api/create-guest-payment-intent` | Public | Create Stripe payment intent for guest |
| POST | `/api/webhook` | Public (Stripe) | Stripe webhook handler |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/recommend` | Public | AI-powered product recommendations |

---

## 9. Glossary

| Term | Definition |
|---|---|
| JWT | JSON Web Token — used for authentication |
| ODM | Object Document Mapper (Mongoose maps JS objects to MongoDB documents) |
| SPA | Single Page Application |
| COD | Cash on Delivery |
| KPI | Key Performance Indicator |
| AOV | Average Order Value |
| Redis | In-memory data store used for caching |
| Stripe Payment Element | Stripe's embeddable UI component for collecting payment details |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| ERD | Entity Relationship Diagram |
| SRS | Software Requirements Specification |

---

*End of SRS Document*
