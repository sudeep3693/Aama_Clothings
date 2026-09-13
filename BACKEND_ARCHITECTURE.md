# BACKEND_ARCHITECTURE.md

Repository path: backend/

This document provides an architectural overview of the backend application, folder structure, core routes/endpoints, middleware, integrations, background jobs, and operational concerns. It is based on code in backend/ (controllers, config, prisma, models, routes, server.js).

1. Architectural summary
- Runtime: Node.js (ESM), Express
- ORM: Prisma (MySQL) — backend/prisma/schema.prisma
- Pattern: Modular MVC-like controllers and route handlers. Controllers encapsulate business logic; config/ manages infra connectors; middleware/ contains auth and request helpers. Accounting domain uses relational models with explicit Prisma relations.
- Concurrency: typical HTTP request/response; no explicit job queue in repo (no Bull/Agenda). Background cron-like jobs would be external or added as scripts.

2. Folder structure (key files)
- backend/
  - server.js (entrypoint)
  - config/
    - db.js (PrismaClient + connect logic)
    - mongodb.js (legacy — not used when Prisma active)
    - cloudinary config (if present)
  - controllers/
    - productController.js, userController.js, orderController.js, cartController.js, categoryController.js, reviewController.js, etc.
  - models/
    - productModel.js, userModel.js, orderModel.js (thin wrappers exporting prisma.model)
  - middleware/
    - authMiddleware.js (user & admin auth), multer setup for multipart uploads
  - prisma/
    - schema.prisma, seed.js
  - routes/ (may exist mapping endpoints to controllers)
  - utils/
    - crypto.js (AES decrypt), helpers
  - tests/
    - unit/integration tests (some present for accounting)

3. Architectural patterns
- Controllers: Each controller exports functions for each route. Functions accept (req, res) and use prisma to query/update DB.
- Models: Adapters that export prisma.* model objects (e.g., export default prisma.product) — used sparingly.
- Validation: Lightweight validation inside controllers (validator package), manual checks for required fields.
- Auth: JWT for session tokens; bcrypt for password hashing; AES used for encrypting credentials in transit from client to server.

4. Core API routes and endpoints (mapped from controllers)
Note: some route files map these controllers under /api or /admin prefixes. Examine backend/routes for exact path wiring.

User/Auth
- POST /api/user/register
  - Input: { firstName, lastName, name?, email, phone?, password (AES-decrypted at server) }
  - Output: { success, token, user } on success
  - Status codes: 200 (success), 400/200 with success:false (controllers return JSON error payloads instead of proper HTTP codes)
- POST /api/user/login
  - Input: { email, encryptedPassword, iv }
  - Output: { success, token, user }
- POST /api/user/profile (get)
  - Input: { userId }
  - Output: { success, user }
- POST /api/user/update
  - Input: { userId, firstName, lastName, phone }
- POST /api/user/change-password
  - Input: { userId, currentPassword, newPassword }
- Admin login: POST /api/admin/login
  - Input: { email, encryptedPassword, iv }
  - Output: { success, token }

Products
- POST /api/product/add (Admin)
  - Multipart form-data: images, and JSON fields (name, price, category, variants, stockQuantity, published, etc.)
  - Side-effects: uploads images to Cloudinary, writes Product and StockLog entries.
- POST /api/product/update
  - Input: product id + fields to update (supports image replacement)
- POST /api/product/toggle-publish
  - Input: { id }
- GET/POST /api/product/list
  - Input: optional admin param to bypass published filter
  - Output: products array with derived fields (rating, reviewCount, categories array)
- POST /api/product/single
  - Input: { productId }
  - Output: detailed product including rating and reviewCount
- POST /api/product/adjust-stock
  - Input: { productId, adjustments: [{size?, color?, quantity}], reason, note, source }
  - Transaction: updates Product.variants or Product.stockQuantity, and creates StockLog entries.
- DELETE /api/product/remove
  - Input: { id }

Cart
- POST /api/cart/add
  - Input: { userId, itemId, size, color }
  - Stores to User.cartData JSON
- POST /api/cart/update
  - Input: { userId, itemId, size, color, quantity }
- POST /api/cart/get
  - Input: { userId }

Orders
- POST /api/order/create
  - Input: { userId, items, amount, address, paymentMethod, payment details }
  - Behavior: creates Order record, adjusts stock, writes ledger entries (accounting controllers exist), returns order confirmation
- GET /api/order/list
  - Input: filtering by user or admin
- POST /api/order/single
  - Input: { orderId }

Categories
- POST /api/category/add
  - Input: { name }
- GET /api/category/list
  - Seeds default categories ["Men","Women","Kids"] when empty
- DELETE /api/category/remove
  - Input: { id }

Reviews
- POST /api/review/add
  - Input: { productId, userId, rating, comment, title? }
  - Behavior: stores Review; controllers recompute ratings at read time

Accounting & Finance (large module)
- Controllers: accountingController, financialController, cogsController, accountingPostingEngine
- Endpoints: create journal entries, retrieve ledgers, post cash transactions, generate period reports
- Important models: JournalEntry, JournalLine, FinancialAccount, CashTransaction, Account, FiscalYear

5. Middleware & Execution Flow
- Typical middleware stack: express.json(), cors(), auth middleware for protected routes, multer for multipart/form-data
- Auth middleware verifies JWT using JWT_SECRET; admin middleware checks token role: "admin"
- Error handling: controllers catch exceptions and respond with { success:false, message:error.message } — status codes are often 200 with success:false. Consider normalizing to proper HTTP status codes.

6. External integrations
- Cloudinary (image uploads): used in product controller (cloudinary.uploader.upload)
- Stripe & Razorpay SDKs included in package.json — checkout flows likely implemented in order/payment controllers
- Validator library for input validation
- JSON web tokens (jsonwebtoken) for auth
- AES encryption: client encrypts the password; server decrypts via decryptAES utility with AES_SECRET_KEY

7. Background workers & scheduled jobs
- No job queue found. There are scripts for prisma db seed and a few accounting test scripts. For background tasks (email, reconciliation, periodic reporting), recommended approaches:
  - Add a cron worker (node-cron) or use external scheduler (e.g., GitHub Actions, Railway cron) for daily reconciliation and ledger closing.
  - Use a message queue (BullMQ + Redis) for long-running tasks (bulk image processing, order reconciliation, sending emails).

8. Observability & testing
- Tests: limited tests exist under backend/tests (accountingEngine.test.js, capitalSolvency.test.js)
- Logging: console.log used; recommend structured logger (pino/winston) for production
- Metrics/Monitoring: none present; recommended to add basic health endpoints and integrate Prometheus/Grafana or external APM

9. Deployment considerations
- Environment variables: backend/.env.example lists DATABASE_URL (MySQL), JWT_SECRET, AES_SECRET_KEY, Cloudinary and payment keys, CORS origins.
- Prisma: commands present for generate, migrate, seed. Use prisma db push/migrate depending on migration strategy.
- Migration artifact: backend/config/mongodb.js exists; confirm that Mongo is not used in production to avoid confusion.

10. Security recommendations
- Return proper HTTP status codes (400/401/403/500) instead of only JSON with success:false
- Rate-limit authentication endpoints and potentially cart/order endpoints
- Enforce input sanitization and length limits for JSON fields with large user input (comments, notes)
- Consider DB-level foreign keys for stronger integrity between core models

11. Next steps for maintainers
- Standardize response schema and HTTP status codes
- Replace console logging with structured logger and capture errors centrally
- Add Redis caching for product lists and session-like data (optional)
- Add unit and integration tests for critical flows (auth, payments, stock adjustments)

-- End of BACKEND_ARCHITECTURE.md --
