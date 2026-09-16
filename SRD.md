# Software Requirements Document (SRD)

## E-Commerce Web Application — Technical Design Specification

**Version:** 1.0  
**Date:** July 6, 2026  
**Prepared for:** E-Commerce Internship Project

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Use Case Model](#3-use-case-model)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Component Specifications](#5-component-specifications)
6. [State Machines](#6-state-machines)
7. [Business Rules](#7-business-rules)
8. [Screen Specifications](#8-screen-specifications)
9. [Integration Specifications](#9-integration-specifications)
10. [Security Design](#10-security-design)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Deployment Architecture](#12-deployment-architecture)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Document (SRD) provides the detailed technical design, component specifications, and implementation blueprint for the E-Commerce Web Application. It complements the SRS by defining *how* the system is built, including architecture decisions, data flows, state management, component hierarchies, and integration patterns.

### 1.2 Scope

This document covers:
- System architecture and module decomposition
- Use cases for all user roles
- Data flow across the system
- Component specifications for both frontend and backend
- State machines for order lifecycle and auth
- Business rules and validation logic
- Screen layouts and navigation flow
- Third-party integrations (Stripe, AI, Redis)
- Security implementation details
- Error handling patterns

### 1.3 Definitions

| Term | Definition |
|---|---|
| Controller | Express.js route handler function |
| Context | React Context for state management |
| Service | API client module making HTTP calls |
| Middleware | Express middleware functions |
| Aggregation | MongoDB aggregation pipeline |

---

## 2. System Architecture

### 2.1 Module Decomposition

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                      │
│                                                             │
│  Layout Layer    │  Pages Layer    │  Component Layer       │
│  ┌───────────┐   │  ┌───────────┐  │  ┌───────────────┐   │
│  │ Navbar    │   │  │ Home      │  │  │ ProductCard   │   │
│  │ Footer    │   │  │ Shop      │  │  │ CartDrawer    │   │
│  │ Layout    │   │  │ Cart      │  │  │ OrderTracker  │   │
│  └───────────┘   │  │ Checkout  │  │  │ StarRating    │   │
│                  │  │ ProductD… │  │  │ ProductWheel  │   │
│  Context Layer   │  │ AdminOr…  │  │  └───────────────┘   │
│  ┌───────────┐   │  │ AdminSa…  │  │                      │
│  │ CartCtx   │   │  └───────────┘  │  Service Layer       │
│  │ AuthCtx   │   │                 │  ┌───────────────┐   │
│  │ Wishlist  │   │                 │  │ productSvc   │   │
│  └───────────┘   │                 │  │ orderSvc     │   │
│                  │                 │  │ adminSvc     │   │
│                  │                 │  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                     │
│                                                             │
│  Routes Layer     │  Controllers    │  Models               │
│  ┌───────────┐    │  ┌───────────┐  │  ┌───────────────┐   │
│  │ authRoutes│    │  │ authCtrl  │  │  │ User          │   │
│  │ productR  │    │  │ productCt │  │  │ Product       │   │
│  │ orderR    │    │  │ orderCtrl │  │  │ Order         │   │
│  │ adminR    │    │  │ adminCtrl │  │  │ Category      │   │
│  │ cartR     │    │  │ aiCtrl    │  │  │ Coupon        │   │
│  └───────────┘    │  └───────────┘  │  └───────────────┘   │
│                   │                                          │
│  Middleware        │  Config          │  External            │
│  ┌───────────┐    │  ┌───────────┐   │  ┌───────────────┐  │
│  │ auth.js   │    │  │ db.js     │   │  │ Stripe SDK    │  │
│  │ cacheMw   │    │  │ cors.js   │   │  │ Gemini AI     │  │
│  │ rateLimit │    │  │ upload.js │   │  │ Redis (opt)   │  │
│  │ errorHndlr│    │  │ env.js    │   │  └───────────────┘  │
│  └───────────┘    │  └───────────┘   │                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌───────────────┐
                    │   MongoDB     │
                    └───────────────┘
```

### 2.2 Request Lifecycle

```
Browser ──► React Router ──► Page Component
                                │
                          ┌─────┴─────┐
                          │  useEffect │
                          └─────┬─────┘
                                │
                          ┌─────▼─────┐
                          │  Service   │──► fetch/axios
                          │  Module    │       │
                          └─────┬─────┘  ┌────▼────┐
                                │         │ Cookies  │
                                │         │ (JWT)    │
                                │         └────┬────┘
                                │              │
                          ┌─────▼──────────────▼──┐
                          │   Express Server       │
                          │   Route → Middleware   │
                          │   → Controller → Model │
                          │   → MongoDB            │
                          └────────────────────────┘
```

### 2.3 Authentication Flow

```
Login Request
     │
     ▼
authLimiter (rate limit: 5/min)
     │
     ▼
login controller
     │
     ├── Find user by email
     ├── Compare bcrypt hash
     ├── Sign JWT { id, role }
     ├── Set HttpOnly cookie (maxAge: 7d)
     └── Return user JSON

Subsequent Requests
     │
     ▼
protect middleware
     │
     ├── Read token from cookie OR Authorization header
     ├── jwt.verify(token, JWT_SECRET)
     ├── Attach req.user = { id, role }
     └── next()

adminOnly middleware
     │
     ├── Check req.user.role === 'admin'
     ├── 403 if not admin
     └── next()
```

---

## 3. Use Case Model

### 3.1 Use Case Diagram (Textual)

```
                    ┌──────────────────────┐
                    │    E-Commerce System  │
                    └──────────────────────┘

Guest:
  ├── Browse Products
  ├── Search/Filter Products
  ├── View Product Details
  ├── Manage Cart (Add/Remove/Update)
  ├── Apply Coupon
  ├── Guest Checkout (with email)
  └── Stripe Payment

Registered User (extends Guest):
  ├── Login/Logout
  ├── Register Account
  ├── Manage Profile
  ├── Change Password
  ├── View Order History
  ├── Manage Wishlist
  └── Standard Checkout

Admin (extends Registered User):
  ├── Manage Products (CRUD + multi-image)
  ├── Manage Orders (view all, update status, mark paid)
  ├── Confirm Order → Deduct Stock
  ├── Manage Categories (CRUD)
  ├── Manage Coupons (CRUD)
  ├── View Sales Analytics
  └── Upload Images
```

### 3.2 Detailed Use Cases

#### UC-1: Browse Products

| Field | Value |
|---|---|
| Actors | Guest, User, Admin |
| Precondition | None |
| Trigger | User visits `/shop` or `/` |
| Flow | 1. System fetches products from API 2. Displays in grid/list 3. User can search, filter, sort 4. Pagination loads more |
| Postcondition | Products displayed |

#### UC-2: Checkout (Authenticated)

| Field | Value |
|---|---|
| Actors | Registered User |
| Precondition | User logged in, cart has items |
| Trigger | User clicks "Proceed to Checkout" |
| Flow | 1. Display shipping form (pre-filled from profile) 2. User selects payment method (Stripe or COD) 3. If Stripe: Payment Element renders, user enters card 4. On submit: create PaymentIntent → confirm payment → create order 5. On success: redirect to `/order-success` |
| Postcondition | Order created in DB, cart cleared |

#### UC-3: Confirm Order (Admin)

| Field | Value |
|---|---|
| Actors | Admin |
| Precondition | Order exists with status "ordered" |
| Trigger | Admin clicks "Mark as confirmed" |
| Flow | 1. System iterates order items 2. For each item: check product exists, check stock >= quantity 3. Deduct stock (product.stock -= quantity) 4. Update order status to "confirmed" 5. Add entry to statusHistory |
| Alternate | Insufficient stock → error message, status NOT changed |
| Postcondition | Stock reduced, order confirmed |

#### UC-4: View Sales Analytics

| Field | Value |
|---|---|
| Actors | Admin |
| Precondition | Admin logged in |
| Trigger | Admin visits `/admin/sales` |
| Flow | 1. System calls `GET /api/admin/sales-analytics` 2. Backend runs 4 aggregation pipelines 3. Frontend renders 4 KPI cards + 3 charts + order table |
| Postcondition | Dashboard displayed |

---

## 4. Data Flow Diagrams

### 4.1 Product Creation Flow

```
[Admin Dashboard Form]
    │
    ├── Upload Image(s) ──► POST /api/upload ──► multer saves file ──► returns URL
    │                        (file stored in /uploads/)
    │
    └── Submit Form ──► POST /api/products
                           │
                           ▼
                    productController.createProduct
                           │
                           ├── Validate input
                           ├── images = images?.length ? images : [image]
                           ├── Product.create()
                           ├── Invalidate Redis cache
                           └── Return 201 + product JSON
                           │
                           ▼
                    AdminDashboard updates product list
```

### 4.2 Payment Flow (Stripe)

```
[Checkout Page]
    │
    ├── POST /api/create-payment-intent
    │       │
    │       ▼
    │   paymentController.createPaymentIntent
    │       │
    │       ├── Calculate amount from cart
    │       ├── stripe.paymentIntents.create({ amount, currency: 'inr' })
    │       └── Return clientSecret
    │
    ├── Stripe Payment Element renders
    │   User enters card details
    │
    ├── stripe.confirmPayment({ clientSecret, paymentMethod })
    │       │
    │       ├── Success ──► POST /api/orders (with paymentIntentId)
    │       │                  │
    │       │                  ▼
    │       │              orderController.createOrder
    │       │                  │
    │       │                  └── Order.create({ isPaid: true, paidAt: now })
    │       │
    │       └── Error ──► Show error on form
    │
    └── [Stripe Webhook] POST /api/webhook
            │
            ├── Verify signature (stripe.webhooks.constructEvent)
            ├── Event: checkout.session.completed
            │       │
            │       ├── order.isPaid = true
            │       ├── order.paidAt = new Date()
            │       └── order.save()
            │
            └── Return 200
```

### 4.3 Stock Deduction Flow

```
[Admin clicks "Mark as Confirmed"]
    │
    ▼
PUT /api/orders/:id  { status: "confirmed" }
    │
    ▼
updateOrderStatus controller
    │
    ├── status === 'confirmed' && order.status !== 'confirmed'
    │       │
    │       ├── For each item in order.items:
    │       │   ├── Product.findById(item.product)
    │       │   ├── Check product exists (400 if not)
    │       │   ├── Check product.stock >= item.quantity (400 if not)
    │       │   └── product.stock -= item.quantity → product.save()
    │       │
    │       └── All deducted successfully → continue
    │
    ├── order.status = "confirmed"
    ├── order.statusHistory.push({ status: "confirmed", timestamp })
    ├── order.save()
    └── Return updated order
```

---

## 5. Component Specifications

### 5.1 Frontend Component Tree

```
App
└── BrowserRouter
    └── AppRoutes
        └── Layout
            ├── Navbar (desktop + mobile nav, auth state, cart badge)
            ├── <Outlet /> (page content)
            ├── CartDrawer (slide-out cart, floating trigger)
            └── Footer

Pages (rendered in Outlet):
├── Home
│   ├── HeroBanner (inline)
│   ├── ProductWheel (animated carousel)
│   ├── FeaturedProducts (ProductCard grid)
│   └── ShopByCategory (category cards)
├── Shop
│   ├── FilterSidebar (category, sort)
│   ├── ProductGridView / ProductListView
│   │   └── ProductCard
│   └── Pagination
├── ProductDetail
│   ├── ImageGallery (main image + thumbnail strip)
│   ├── StarRating
│   ├── QuantitySelector
│   ├── AddToCart button
│   └── RecommendedProducts
├── Cart
│   ├── CartItem rows
│   ├── CouponInput
│   └── OrderSummary
├── Checkout
│   ├── ShippingForm
│   ├── PaymentMethod selector
│   ├── StripePaymentElement
│   └── OrderSummary
├── AdminDashboard
│   ├── ProductTable (CRUD + inline stock edit)
│   ├── ProductFormModal (multi-image upload)
│   └── CategoryManager
├── AdminOrders
│   ├── SearchBar + FilterChips
│   ├── OrderCard (collapsible)
│   │   ├── OrderTracker
│   │   ├── ItemsList
│   │   ├── PriceBreakdown
│   │   └── StatusManagement buttons
│   └── FlashMessages
├── AdminSalesDashboard
│   ├── KpiCards (4 metric cards with growth badges)
│   ├── RevenueChart (AreaChart - Recharts)
│   ├── CategoryPieChart (PieChart - Recharts)
│   ├── TopProducts (progress bar leaderboard)
│   └── RecentOrdersTable (searchable, filterable)
└── MyOrders / MyProfile (user views)
```

### 5.2 Backend Component Specs

#### Middleware Chain

```
Request
  │
  ├── cors(corsOptions)
  ├── cookieParser()
  ├── express.json()  (except webhook route — uses raw body)
  │
  ├── Route matched
  │     │
  │     ├── [authLimiter] — rate limit (auth routes only)
  │     ├── [cacheProducts] — Redis caching (GET /products only)
  │     ├── [protect] — JWT verification (protected routes)
  │     ├── [adminOnly] — role check (admin routes)
  │     │
  │     └── Controller
  │           │
  │           └── Response JSON
  │
  └── errorHandler (catches all thrown/async errors)
```

#### Controller Responsibilities

| Controller | Key Functions | Data Accessed |
|---|---|---|
| authController | register, login, logout, getProfile, updateProfile, changePassword | User |
| productController | getProducts, getProductById, getRecommendations, createProduct, updateProduct, deleteProduct | Product |
| orderController | createOrder, createGuestOrder, getMyOrders, getOrderById, getAllOrders, markOrderAsPaid, updateOrderStatus | Order, Product (for stock) |
| adminController | getSalesAnalytics | Order (4 aggregations) |
| categoryController | CRUD operations | Category |
| couponController | CRUD + validation | Coupon |
| paymentController | createPaymentIntent, createGuestPaymentIntent, handleWebhook | Order, Product |
| aiController | generateRecommendations | Product (read via AI) |

### 5.3 Context Specifications

#### CartContext

```
State:
  items: CartItem[]        // { id, name, price, quantity, image }
  coupon: Coupon | null
  discount: number
  open: boolean            // drawer visibility

Derived:
  totalItems: number       // sum of quantities
  totalPrice: number       // sum of price * qty - discount
  itemsPrice: number       // sum of price * qty

Methods:
  addToCart(id, qty, name, price, image)
  removeFromCart(id)
  updateQuantity(id, qty)
  clearCart()
  applyCoupon(code)        // POST /api/cart/validate-coupon
  removeCoupon()
  toggleDrawer()

Persistence:
  - localStorage key: "ecommerce_cart_v2" (versioned for migration)
  - On load: parse + validate + sanitize items
  - On change: serialize + save
```

#### WishlistContext

```
State:
  items: string[]          // array of product IDs

Methods:
  toggleWishlist(productId)
  isInWishlist(productId): boolean

Persistence:
  - localStorage key: "ecommerce_wishlist"
```

#### AuthContext (implicit via cookie)

```
No explicit React Context needed — JWT is in HttpOnly cookie.
Auth state derived from:
  - GET /api/auth/profile response (on app load)
  - 401 responses → redirect to /login
```

---

## 6. State Machines

### 6.1 Order Status State Machine

```
                    ┌─────────┐
                    │ ordered │ (initial state)
                    └────┬────┘
                         │
                    ┌────▼──────┐
             ┌──────┤ confirmed │◄──── Stock deducted here
             │      └────┬──────┘
             │           │
             │      ┌────▼──────┐
             │      │ dispatched│
             │      └────┬──────┘
             │           │
             │      ┌────▼──────────┐
             │      │ arrived_at_   │
             │      │ city          │
             │      └────┬──────────┘
             │           │
             │      ┌────▼──────────┐
             │      │ assigned_to_  │
             │      │ rider         │
             │      └────┬──────────┘
             │           │
             │      ┌────▼──────┐
             └──────┤ delivered │ (terminal state → isDelivered=true)
                    └───────────┘

Transitions:
  ordered → confirmed (admin action, stock deducted)
  confirmed → dispatched (admin action)
  dispatched → arrived_at_city (admin action)
  arrived_at_city → assigned_to_rider (admin action)
  assigned_to_rider → delivered (admin action, isDelivered=true)

Guards:
  - Can only advance forward (no regression)
  - confirmed: requires sufficient stock
  - delivered: terminal (no further transitions)
```

### 6.2 Authentication State Machine

```
                    ┌──────────┐
         ┌─────────►│ Unauthent│◄─────────┐
         │          │ icated   │           │
         │          └─────┬────┘           │
         │                │                │
         │           ┌────▼────┐           │
         │           │  Login  │           │
         │           │  Form   │           │
         │           └────┬────┘           │
         │                │                │
         │          ┌─────▼──────┐         │
         │          │ Authentica-│         │
         │          │ tion check │         │
         │          └─────┬──────┘         │
         │       ┌───────┼────────┐        │
         │       │       │        │        │
         │  ┌────▼──┐ ┌──▼───┐ ┌──▼────┐  │
         │  │ Valid │ │Invalid│ │Expired│  │
         │  │ Token │ │Token │ │Token  │  │
         │  └───┬───┘ └──┬───┘ └──┬───-┘  │
         │      │        │        │        │
         │      ▼        ▼        ▼        │
         │  ┌──────┐ ┌──────┐ ┌──────┐    │
         │  │Authen-│ │Redirect to│Redirect│
         │  │ticated│ │ /login    │ /login │
         │  └──┬───┘ └──────┘ └──────┘    │
         │     │                           │
         │     ├── role=user ──► User pages│
         │     └── role=admin ──► Admin    │
         │                     pages       │
         │     Logout ─────────────────────┘
```

### 6.3 Cart State Machine

```
                    ┌───────────┐
                    │   Empty   │
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
              ┌─────┤ Has Items │◄──────┐
              │     └─────┬─────┘       │
              │           │             │
              │     ┌─────▼──────┐      │
              │     │  Apply     │      │
              │     │  Coupon    │      │
              │     └─────┬──────┘      │
              │           │             │
              │     ┌─────▼──────┐      │
              │     │ Checkout   │      │
              │     │ (validate) │      │
              │     └─────┬──────┘      │
              │           │             │
              │     ┌─────▼──────┐      │
              │     │  Order     ├──────┘ (clearCart)
              │     │  Placed    │
              │     └────────────┘

Transitions:
  Empty → Has Items: addToCart()
  Has Items → Has Items: updateQuantity(), removeItem(), applyCoupon()
  Has Items → Empty: clearCart(), removeAllItems()
```

---

## 7. Business Rules

### 7.1 Pricing Rules

| Rule ID | Description |
|---|---|
| PRICE-1 | Regular price MUST be a positive number |
| PRICE-2 | Original price (if set) MUST be >= regular price (for valid discount display) |
| PRICE-3 | Discount percentage = `Math.round((1 - price / originalPrice) * 100)` |
| PRICE-4 | Total price = itemsPrice + shippingPrice - discount |
| PRICE-5 | All prices stored and calculated in INR |
| PRICE-6 | NaN values MUST be coerced to 0 with fallback |

### 7.2 Stock Rules

| Rule ID | Description |
|---|---|
| STOCK-1 | Stock MUST be a non-negative integer |
| STOCK-2 | Stock is deducted ONLY when order status changes to "confirmed" |
| STOCK-3 | Stock deduction is atomic per product (saved immediately) |
| STOCK-4 | If any item has insufficient stock, NO stock is deducted (all-or-nothing within the loop, but saved per product — see note) |
| STOCK-5 | Out-of-stock products (stock = 0) MUST show overlay on product card |
| STOCK-6 | Low stock (< 10) shows amber warning in admin dashboard |

### 7.3 Order Rules

| Rule ID | Description |
|---|---|
| ORD-1 | Order status MUST progress in defined order (no skipping or regression) |
| ORD-2 | `isPaid` and `paidAt` are set either via Stripe webhook or admin "Mark Paid" action |
| ORD-3 | `isDelivered` and `deliveredAt` are set when status reaches "delivered" |
| ORD-4 | Guest orders MUST have a `guestEmail` |
| ORD-5 | Registered orders MUST reference the user's ObjectId |
| ORD-6 | Order total MUST equal itemsPrice + shippingPrice - discount |

### 7.4 Coupon Rules

| Rule ID | Description |
|---|---|
| CPN-1 | Coupon code is case-insensitive (stored uppercase) |
| CPN-2 | Discount is percentage-based (0-100) |
| CPN-3 | Expired coupons (expiresAt < now) MUST be rejected |
| CPN-4 | Coupon code MUST be unique |
| CPN-5 | Multiple coupons on same cart are NOT supported |

### 7.5 Image Rules

| Rule ID | Description |
|---|---|
| IMG-1 | Every product MUST have at least one image (`image` field) |
| IMG-2 | `image` is the primary/thumbnail URL |
| IMG-3 | `images` array contains ALL image URLs (primary + additional) |
| IMG-4 | The first element of `images` MUST equal `image` |
| IMG-5 | Uploaded images are stored in `/backend/uploads/` |
| IMG-6 | Max file size: 5MB |
| IMG-7 | Allowed types: image/* |

### 7.6 Access Rules

| Rule ID | Description |
|---|---|
| AUTH-1 | All `/admin/*` routes require `requireAdmin` on the frontend ProtectedRoute AND `protect, adminOnly` middleware on backend |
| AUTH-2 | User-specific data (orders, profile) MUST verify ownership |
| AUTH-3 | Guest checkout bypasses auth but requires email |
| AUTH-4 | JWT MUST be present in cookie or Authorization header |

---

## 8. Screen Specifications

### 8.1 Home Page (`/`)

```
┌─────────────────────────────────────────────────────┐
│  Navbar (Logo, Shop, About, Cart badge, Login/User) │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │           Hero Banner (full width)             │  │
│  │  Headline + CTA Button → /shop                │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────── Shop by Category ───────────────┐ │
│  │  [Cat1] [Cat2] [Cat3] [Cat4] [Cat5] [Cat6]    │ │
│  └────────────────────────────────────────────────-┘│
│                                                     │
│  ┌───────── Featured Products (4 cols grid) ───────┐│
│  │  [Card]  [Card]  [Card]  [Card]                 ││
│  └─────────────────────────────────────────────────-┘│
│                                                     │
│  ┌────────────── Product Wheel ────────────────────┐│
│  │      ◄  [animated carousel]  ►                  ││
│  └─────────────────────────────────────────────────-┘│
│                                                     │
│  ┌─────────────── Deals Section ───────────────────┐│
│  │  [Card]  [Card]  [Card]  [Card]                 ││
│  └─────────────────────────────────────────────────-┘│
├─────────────────────────────────────────────────────┤
│  Footer (Links, Contact, Social)                     │
└─────────────────────────────────────────────────────┘
```

### 8.2 Admin Sales Dashboard (`/admin/sales`)

```
┌─────────────────────────────────────────────────────┐
│  Navbar (admin: Dashboard, Orders, Sales)            │
├─────────────────────────────────────────────────────┤
│  Sales Analytics                  [Back to Admin]   │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Revenue│ │Orders│ │ AOV  │ │Items │              │
│  │₹55.4K │ │  6   │₹91.7K │ │  12  │              │
│  │ ▲12.3%│ │ ▲8%  │ ▲5.1% │ │ ▲15% │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                     │
│  ┌───────────────────┐ ┌──────────────┐            │
│  │ Revenue Trend     │ │ Category     │            │
│  │ (AreaChart)       │ │ (PieChart)   │            │
│  │                   │ │              │            │
│  └───────────────────┘ └──────────────┘            │
│                                                     │
│  ┌─── Top Products ───────────────────────────────┐│
│  │ Product A  ████████████░░░░  ₹12,000 (20)     ││
│  │ Product B  ██████████░░░░░░  ₹10,000 (15)     ││
│  │ ...                                            ││
│  └────────────────────────────────────────────────-┘│
│                                                     │
│  ┌─── Recent Orders ────────[Search] [Filter] ────┐│
│  │ #ABC123 │ User │ ₹1,200 │ Paid │ Delivered     ││
│  │ #DEF456 │ User │ ₹2,400 │ Unpaid │ Processing  ││
│  └────────────────────────────────────────────────-┘│
└─────────────────────────────────────────────────────┘
```

### 8.3 Admin Orders (`/admin/orders`)

```
┌─────────────────────────────────────────────────────┐
│  Navbar (admin nav with active state)               │
├─────────────────────────────────────────────────────┤
│  Orders           [Back to Products]                │
│                                                     │
│  [Search by ID, name, email...]  [All] [Paid] ...   │
│                                                     │
│  ┌── Order #ABC123 ────[Paid] [Delivered] ₹1,200 ─┐│
│  │ [expanded]                                       ││
│  │  Items: [img] Product A × 2 = ₹800              ││
│  │  Order Status: ●●●●○○○○  (tracker)              ││
│  │  Subtotal: ₹1,000 | Shipping: Free | Total: ₹1K ││
│  │  Shipping to: John, 123 Main St, NY             ││
│  │  Payment: Card (Stripe) | Paid on Jul 1, 2026   ││
│  │                                                  ││
│  │  Update Status: [Confirmed] [Dispatched] [...]  ││
│  └──────────────────────────────────────────────────-┘│
│  ┌── Order #DEF456 ──[Unpaid] [Processing] ₹2,400 ─┐│
│  │ ...                                              ││
│  └──────────────────────────────────────────────────-┘│
└─────────────────────────────────────────────────────┘
```

### 8.4 Admin Product Form (Modal)

```
┌─────────────────────────────────────────────────────┐
│  [X] Add New Product                                 │
├─────────────────────────────────────────────────────┤
│  Product Name: [___________________________]        │
│                                                     │
│  Price (Rs): [_______]  Original Price: [________]  │
│                                                     │
│  Stock: [________]                                   │
│                                                     │
│  Category: [▼ Select category ___________]          │
│            or [Other (add new)]                      │
│                                                     │
│  Product Images:                                     │
│  ┌────┐ ┌────┐ ┌────┐                               │
│  │ img│ │ img│ │ img│   [+ Upload] [+ URL]         │
│  │Prim│ │    │ │    │                               │
│  └────┘ └────┘ └────┘                               │
│                                                     │
│  Description:                                        │
│  [__________________________________________]        │
│  [__________________________________________]        │
│                                                     │
│           [Cancel]        [Create Product]          │
└─────────────────────────────────────────────────────┘
```

### 8.5 Product Detail Page (`/product/:id`)

```
┌─────────────────────────────────────────────────────┐
│  Navbar                                              │
├─────────────────────────────────────────────────────┤
│  Home / Shop / Category / Product Name               │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────┐ ┌──────────────────────────┐ │
│  │   Main Image      │ │ Category: Electronics    │ │
│  │   (aspect-square) │ │                          │ │
│  │   [♥] [Share]     │ │ Product Name (title)     │ │
│  │   40% OFF         │ │ ★★★★☆ (24 reviews)       │ │
│  └───────────────────┘ │                          │ │
│  ┌───┐┌───┐┌───┐┌───┐│ │ Price: ₹1,999           │ │
│  │img││img││img││img││ │   ₹2,499 (strikethrough) │ │
│  └───┘└───┘└───┘└───┘│ │                          │ │
│                        │ │ Description text here... │ │
│                        │ │                          │ │
│                        │ │ ✅ In Stock (50 avail.)  │ │
│                        │ │                          │ │
│                        │ │ [−] 1 [+]               │ │
│                        │ │ [ Add to Cart — ₹1,999 ]│ │
│                        │ │                          │ │
│                        │ │ Free Shipping | Easy     │ │
│                        │ │ Returns | Secure Checkout│ │
│                        └──────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Recommended Products (horizontal scroll)            │
│  [Card] [Card] [Card] [Card]                        │
└─────────────────────────────────────────────────────┘
```

---

## 9. Integration Specifications

### 9.1 Stripe Integration

| Detail | Specification |
|---|---|
| SDK | `stripe` npm package |
| API Version | Latest (2024+) |
| Currency | INR (Indian Rupees) |
| Payment Flow | Payment Intents API |
| Frontend Component | Stripe Payment Element |
| Webhook Events | `checkout.session.completed` |
| Webhook Path | `POST /api/webhook` |
| Webhook Auth | Signature verification with `STRIPE_WEBHOOK_SECRET` |

**Payment Intent Creation:**
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalPrice * 100), // paise
  currency: 'inr',
  metadata: { orderId },
})
```

### 9.2 Google Gemini AI Integration

| Detail | Specification |
|---|---|
| SDK | `@google/generative-ai` |
| Model | `gemini-2.0-flash` |
| Endpoint | `POST /api/ai/recommend` |
| Fallback | Aggregation-based recommendations if AI unavailable |
| Prompt | Sends product data + instruction to return product recommendations |

### 9.3 Redis Caching (Optional)

| Detail | Specification |
|---|---|
| Client | `ioredis` (optional dependency) |
| Cache Key | `products:${JSON.stringify(queryParams)}` |
| TTL | 300 seconds (5 minutes) |
| Invalidation | On product create/update/delete → `invalidateProductCache()` flushes all keys matching `products:*` |
| Graceful Degrade | If Redis unavailable, skip cache and query MongoDB directly |

### 9.4 MongoDB Connections

| Detail | Specification |
|---|---|
| Connection String | `mongodb://localhost:27017/ecommerce` |
| ODM | Mongoose 8.x |
| Connection Events | `connected`, `error`, `disconnected` logged to console |
| Indexes | Text index on `name` + `category`, index on `price`, index on `category` |

---

## 10. Security Design

### 10.1 JWT Implementation

```javascript
// Token generation
jwt.sign(
  { id: user._id, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
)

// Cookie settings
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
})
```

### 10.2 Password Hashing

```javascript
import bcrypt from 'bcryptjs'
const salt = await bcrypt.genSalt(12)
const hash = await bcrypt.hash(password, salt)
const match = await bcrypt.compare(inputPassword, hash)
```

### 10.3 CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allow cookies
}
```

### 10.4 Rate Limiting

| Route | Limit | Window |
|---|---|---|
| `/api/auth/*` | 5 requests | 1 minute |

### 10.5 Input Validation

- All write endpoints validate required fields
- Mongoose schema validation (required, min, max, enum)
- File type and size validation via multer

### 10.6 Security Headers (via express)

- Cookie: `HttpOnly, SameSite=Strict`
- No sensitive data in error messages (production)
- JWT secret from environment variable

---

## 11. Error Handling Strategy

### 11.1 Backend Error Handling

**Global Error Handler** (`middleware/errorHandler.js`):
```javascript
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || 'Internal server error'
  res.status(status).json({ message })
}
```

**Error Categories:**

| Error Type | HTTP Status | Example |
|---|---|---|
| Validation | 400 | Missing required field, invalid stock |
| Authentication | 401 | Missing token, invalid token |
| Authorization | 403 | Non-admin accessing admin route |
| Not Found | 404 | Product/order doesn't exist |
| Conflict | 409 | Duplicate coupon code |
| Rate Limit | 429 | Too many login attempts |
| Server Error | 500 | Database connection failure |

**Async Error Handling:**
- `express-async-errors` package auto-catches async errors
- Controllers use `try/catch` for granular error handling
- All errors pass to the global `errorHandler`

### 11.2 Frontend Error Handling

| Scenario | Handling |
|---|---|
| API call fails | `try/catch` in service/component, set error state, display error message |
| Network error | Catch, show "Failed to connect" message |
| Image load failure | `onError` handler hides broken image or shows placeholder |
| Invalid data | Nullish coalescing (`??`), optional chaining (`?.`) |
| Empty data | Empty state UI with appropriate message |
| NaN values | `isNaN` guard in `formatCurrency`, `Number()` coercion with `|| 0` |
| 401 response | Redirect to `/login` (ProtectedRoute) |
| 403 response | Redirect to `/` (unauthorized) |

### 11.3 UI States per Component

Every data-fetching component MUST handle 4 states:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Loading     │  │    Error     │  │    Empty     │  │    Data      │
│              │  │              │  │              │  │              │
│  [Spinner/   │  │  [Message]   │  │  [Illustra-  │  │  [Content]   │
│   Skeleton]  │  │  [Retry Btn] │  │   tion]      │  │              │
│              │  │              │  │  [Message]   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 12. Deployment Architecture

### 12.1 Development Environment

```
Backend:  node server.js          → localhost:5000
Frontend: npx vite                → localhost:5173
MongoDB:  mongod                  → localhost:27017
Redis:    redis-server (optional) → localhost:6379
```

### 12.2 Production Environment (Target)

```
                         ┌──────────────┐
                         │   Vercel     │
                         │  (Frontend)  │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │   Render /   │
                         │   Railway    │
                         │  (Backend)   │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼───┐ ┌────▼────┐ ┌────▼────┐
              │ MongoDB  │ │ Stripe  │ │  Redis  │
              │  Atlas   │ │  API    │ │ (opt)   │
              └─────────┘ └─────────┘ └─────────┘
```

### 12.3 Environment Variables

```
# Backend (.env)
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=change_this_to_a_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=...

# Frontend (via Vite env)
VITE_API_URL=http://localhost:5000/api
```

---

*End of SRD Document*
