<div align="center">

# Clothes Store — E-Commerce (MERN)

### "Elegant" — a full-stack clothing e-commerce with customer store & admin panel

A complete MERN e-commerce: a customer storefront, an admin dashboard, and a
Node/Express + MongoDB API with image uploads and Stripe/Razorpay checkout.

![Status](https://img.shields.io/badge/status-archived-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-MERN-13aa52)
![React](https://img.shields.io/badge/React-61DAFB)
![Express](https://img.shields.io/badge/Express-API-000000)

</div>

---

> [!NOTE]
> **Archived project, open-sourced as-is under MIT.** Built to demonstrate
> full-stack e-commerce development with the MERN stack. All secrets are provided
> via `.env` files (git-ignored) — see [Configuration](#configuration).

## Overview

This project implements an online clothing store for a brand called **Elegant**.
It's split into three apps that run together:

- **`frontend/`** — the customer-facing storefront (browse, cart, checkout)
- **`admin/`** — an admin dashboard (manage products and orders)
- **`backend/`** — a REST API (auth, products, cart, orders, payments)

## Screenshots

| Homepage | Product Page |
| --- | --- |
| ![Homepage](./Screenshot%202024-12-06%20005933.png) | ![Product Page](./Screenshot%202024-12-06%20010437.png) |

| Cart | Checkout |
| --- | --- |
| ![Cart](./Screenshot%202024-12-06%20010909.png) | ![Checkout](./Screenshot%202024-12-06%20011217.png) |

## Features

- 🛍️ **Storefront** — product catalog, collections, product detail, cart
- 👤 **Auth** — user registration & login with JWT (bcrypt-hashed passwords)
- 🧺 **Cart & orders** — add to cart, place orders, order history
- 💳 **Payments** — Stripe and Razorpay checkout integrations
- 🖼️ **Media** — product image uploads via Multer + Cloudinary
- 🛠️ **Admin panel** — add / list / remove products, view and manage orders
- 🔐 **Role protection** — separate user and admin auth middleware

## Tech Stack

| Layer | Tech |
| --- | --- |
| **Frontend** | React, React Router, Axios, React-Toastify |
| **Admin** | React (Vite), React Router, Axios |
| **Backend** | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Multer |
| **Integrations** | Cloudinary (images), Stripe & Razorpay (payments), Validator |

## Project Structure

```
Clothes-Store-ECommerce/
├── frontend/   # Customer storefront (React)
├── admin/      # Admin dashboard (React + Vite)
└── backend/    # Express + MongoDB REST API
    ├── config/       # mongodb, cloudinary
    ├── controllers/  # product, user, cart, order
    ├── middleware/   # auth, adminAuth, multer
    ├── models/       # user, product, order
    └── routes/       # product, user, cart, order
```

## Getting Started

> Requires **Node.js 18+**, a **MongoDB** database, and (for full functionality)
> **Cloudinary**, **Stripe**, and **Razorpay** accounts.

```bash
git clone https://github.com/dexter747/Clothes-Store-ECommerce.git
cd Clothes-Store-ECommerce
```

Run each app in its own terminal:

```bash
# 1) Backend API
cd backend && npm install
# create backend/.env (see Configuration), then:
npm run server        # nodemon dev server

# 2) Customer storefront
cd ../frontend && npm install && npm run dev

# 3) Admin dashboard
cd ../admin && npm install && npm run dev
```

## Configuration

Create a `.env` in `backend/` (git-ignored) with:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_SECRET_KEY=your_secret
STRIPE_SECRET_KEY=your_stripe_key
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

The `frontend/` and `admin/` apps read the backend URL from their own `.env`
(e.g. `VITE_BACKEND_URL=http://localhost:4000`).

## License

Released under the [MIT License](./LICENSE) © 2024 Maitreya Kulkarni.
