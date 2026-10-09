# Pick2Buy — Complete Full-Stack Ecommerce Platform 🛍️

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/Frontend-React_18_TypeScript-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express_TypeScript-339933.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_Prisma_ORM-336791.svg)](https://www.prisma.io/)
[![Market](https://img.shields.io/badge/Market-India_(INR_₹)-ff9933.svg)](https://pick2buy.in)

Pick2Buy is a modern, high-performance, conversion-optimized ecommerce and dropshipping platform tailored specifically for the Indian market (INR ₹). Inspired by leading luxury ecommerce design patterns, Pick2Buy features a mobile-first responsive storefront, complete customer portal, robust order & checkout engine, Razorpay + COD payment systems, and an enterprise-grade Admin Dashboard & CRM suite.

---

## 🌟 Key Highlights & Features

### 🛒 Customer Storefront & UX
- **Design & Polish**: Ultra-clean, luxury aesthetic with fluid micro-interactions, responsive typography, and sticky mobile quick-action controls.
- **Dynamic Homepage**: Hero banners, flash sale tickers, trending collections, best sellers, trust badges, and newsletter subscriptions.
- **Faceted Product Search & Filtering**: Fast typo-tolerant search, instant suggestions, price range slider, category breadcrumbs, and multi-attribute filters (brand, rating, stock status, discount).
- **Product Detail Page (PDP)**: High-resolution image gallery with zoom, variant selector (size, color, storage), PIN code delivery & COD checker, live stock status, reviews with customer photos, and "Frequently Bought Together" bundles.
- **Cart & Slide-over Drawer**: Real-time server-validated cart calculations, coupon code discount validator, shipping estimates, and instant checkout trigger.
- **Multi-Step Secure Checkout**: Guest & authenticated checkout, multiple saved Indian addresses with landmark & PIN code validation, flexible delivery speed options, and order summary.
- **Payment Abstraction**: Full Razorpay payment gateway integration ready alongside a verified Cash on Delivery (COD) workflow with PIN code and order limit rules.
- **Order Lifecycle & Timeline**: Live step-by-step order tracking timeline (Placed ➔ Confirmed ➔ Processing ➔ Packed ➔ Shipped ➔ Out for Delivery ➔ Delivered) with printable invoices.
- **Customer Account Portal**: Profile management, order history, persistent multi-device wishlist, address book, reviews, and customer support ticket manager.

### 🏢 Enterprise Admin Dashboard & CRM
- **Executive Analytics**: Real-time KPI cards (Total Revenue, Orders, Average Order Value, Conversion Rate, Low Stock Alerts) and date-filtered interactive trend charts.
- **Product & Variant Catalog**: Full CRUD with SKU tracking, multi-tier pricing (MRP vs Selling Price), inventory management, and SEO metadata configuration.
- **Inventory Engine**: Automated stock deduction with concurrency-safe database transactions, safety thresholds, and low-stock alerts.
- **Full-featured CRM**: Customer 360° profiles (LTV, total orders, cart activity, communication history), lead pipeline with Kanban stages, and custom dynamic segmentations (e.g. High-Value, COD shoppers, Cart Abandoners).
- **Customer Support Desk**: Ticketing system with priority queues, agent assignments, status transitions, and customer-staff messaging threads.
- **Marketing & Promotions**: Comprehensive coupon engine (percentage/fixed discounts, minimum cart value, usage caps, category constraints) and promotional banner management.
- **Role-Based Access Control (RBAC) & Audit Logs**: Fine-grained permissions for Admin, Manager, Staff, and Support Agents, with tamper-evident audit logs tracking all administrative actions.

---

## 🏗️ Architecture & Monorepo Structure

```
/pick2buy
  ├── /frontend           # React 18 + Vite + TypeScript + Tailwind CSS + Zustand
  │     ├── /src/components   # Reusable UI, Storefront, & Admin components
  │     ├── /src/pages        # Storefront pages, Account, & Admin routes
  │     ├── /src/layouts      # Storefront & Admin sidebar layouts
  │     ├── /src/store        # Zustand state stores (Auth, Cart, Wishlist)
  │     └── /src/services     # Typed Axios API client
  ├── /backend            # Node.js + Express + TypeScript + Prisma ORM
  │     ├── /src/controllers  # Request handling & business logic
  │     ├── /src/middlewares  # Auth JWT, RBAC, Error handler, Rate limiters
  │     ├── /src/routes       # Modular REST API endpoints
  │     └── /prisma           # PostgreSQL schema & database seed scripts
  ├── /shared             # Shared TypeScript models, interfaces & validation schemas
  ├── /docker             # Dockerfiles for frontend & backend
  ├── docker-compose.yml  # Multi-container orchestration (App + Postgres)
  └── .env.example        # Environment variables configuration template
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **npm**: v9.0+
- **PostgreSQL**: v14+ (or run via Docker)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/pick2buy/pick2buy.git
cd pick2buy
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Set `DATABASE_URL` to your PostgreSQL connection string in the backend's private environment. For local development, you can instead set `POSTGRES_DATABASE_URL` in ignored `backend/.env.local`; it takes precedence over the old SQLite URL in `backend/.env`:
```env
POSTGRES_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key
RAZORPAY_KEY_ID=rzp_test_pick2buy_placeholder_key
RAZORPAY_KEY_SECRET=rzp_test_pick2buy_placeholder_secret
EMAIL_FROM="Pick2Buy India <pick2buy.in@gmail.com>"
```

Email/password sign-in and sign-up require a six-digit email code before a session is issued. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` in `backend/.env.local` (or your deployment secrets). The sample SMTP password in `backend/.env` cannot send email. For Gmail SMTP, use a Google App Password from an account with 2-Step Verification.

### 4. Initialize PostgreSQL
Generate the Prisma client and apply tracked migrations to an empty PostgreSQL database:
```bash
npm run db:generate
npm run db:migrate
npm run db:categories
```

The database starts without demo accounts or products. `db:categories` adds the storefront categories and can be run again without duplicating them. Do not run the demo seed on PostgreSQL: it contains example accounts and fixed passwords, and the seed command refuses PostgreSQL connections. The previous local SQLite schema remains in `backend/prisma/schema.sqlite.prisma`, with its data in the ignored `backend/prisma/dev.db`. Backend tests create a separate local SQLite test database and restore the PostgreSQL client afterward.

### 5. Start Development Servers
Run the full-stack monorepo concurrently:
```bash
# Terminal 1: Start Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Start Frontend Dev Server (http://localhost:5173)
npm run dev:frontend
```

---

## 🐳 Docker Deployment

To launch the complete application stack (PostgreSQL, Backend API, and Frontend web server) using Docker Compose:

```bash
# Start all containers in detached mode
docker compose up -d

# View real-time container logs
docker compose logs -f

# Shut down containers
docker compose down
```

---

## 🔑 Demo & Admin Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@pick2buy.in` | `ChangeMe123!` | Complete system & Admin Panel (`/admin`) |
| **Customer** | `rahul.sharma@example.com` | `Password123!` | Storefront, Wishlist, Cart & Orders |

> ⚠️ **Important Security Notice**: The default admin credentials above are for local development and demonstration only. Ensure you rotate secrets and update admin credentials before deploying to a production environment.

---

## 📡 Core API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new customer account | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | No |
| `GET` | `/api/auth/me` | Retrieve authenticated profile | Yes |
| `GET` | `/api/products` | Browse & search product catalog with filters | No |
| `GET` | `/api/products/:slug` | Retrieve single product details & variants | No |
| `GET` | `/api/categories` | Get category hierarchy tree | No |
| `GET` | `/api/cart` | Get current user / session cart | Optional |
| `POST` | `/api/cart/items` | Add product / variant to cart | Optional |
| `POST` | `/api/orders` | Place order (Server-side price & stock check) | Yes |
| `GET` | `/api/orders/track/:orderNumber` | Live order delivery timeline | No / Yes |
| `POST` | `/api/coupons/validate` | Server-side discount coupon evaluation | No / Yes |
| `GET` | `/api/admin/dashboard` | Administrative overview metrics & analytics | Admin / Staff |
| `GET` | `/api/admin/crm/customers` | Customer 360 CRM records | Admin / Staff |
| `GET` | `/api/admin/crm/leads` | Lead pipeline records & Kanban data | Admin / Staff |
| `GET` | `/api/admin/tickets` | Customer support ticket queue | Admin / Support |

---

## 🔒 Security & Best Practices

- **Zero Client Trust for Pricing**: All product pricing, applicable tax rates, promotional discounts, and shipping fees are computed strictly on the backend.
- **ACID Transaction Safeguards**: Checkout operations reserve and deduct inventory atomically to prevent overselling.
- **Security Headers & Defense-in-Depth**: Protected via `helmet`, strict CORS policies, bcrypt/argon2 password hashing, rate limiting, and parameter validation.
- **Audit Trails**: Every administrative modification (order status update, pricing change, coupon deletion) is logged with user attribution and IP timestamps.

---

## 📬 Contact & Support

- **Brand**: Pick2Buy India
- **Official Contact**: `pick2buy.in@gmail.com`
- **Domain**: [pick2buy.in](https://pick2buy.in)
- **Target Currency**: INR (₹)
