# FEATURES_CATALOG.md

Purpose
- Catalog existing and planned features with requirements, acceptance criteria, dependencies and current status to help product, engineering and AI agents prioritize work.

Legend
- Status: Implemented, In Progress, Planned
- Dependencies: backend controllers, prisma models, cloudinary, payment providers

1. Storefront (Products Browsing)
- Status: Implemented
- Requirements: Product listing, filtering by category, search, pagination, sort, product detail page with images and variants
- Acceptance criteria: product list loads within 2s on dev environment; product detail shows images, price, available sizes/colors; add-to-cart is functional
- Dependencies: backend.productController (listProducts, singleProduct), Cloudinary for images

2. Authentication (Users & Admin)
- Status: Implemented
- Requirements: Register, Login, JWT-based sessions, protected routes for user profile and admin
- Acceptance criteria: user register/login returns token; admin login returns role:admin token; protected routes return 401 if unauthorized
- Dependencies: userController, admin model, JWT_SECRET

3. Cart Management
- Status: Implemented
- Requirements: Add to cart, update cart quantities, persist cart server-side (User.cartData), display cart
- Acceptance criteria: cart operations persist and reflect immediately across sessions for same user
- Dependencies: cartController, User.cartData JSON field

4. Checkout & Payments
- Status: Implemented (integrations present)
- Requirements: Initiate Stripe/Razorpay checkout, handle successful & failed payments, create Order record
- Acceptance criteria: successful payment marks order.payment = true and returns confirmation; failed payment returns error and no stock decrement
- Dependencies: orderController, payment SDKs, environment keys (STRIPE_SECRET_KEY, RAZORPAY_*)

5. Admin Dashboard
- Status: Implemented (admin/ app)
- Requirements: CRUD for products, view orders, adjust stock, manage categories, run reports
- Acceptance criteria: admin can create product with images, view orders list and change statuses
- Dependencies: admin app, auth middleware, productController, orderController

6. Reviews & Ratings
- Status: Implemented
- Requirements: Submit reviews, compute product ratings, display review list
- Acceptance criteria: adding a review increases reviewCount and adjusts rating calculation; review moderation (verified flag) available for admin
- Dependencies: reviewController, Review model

7. Inventory & Stock Management
- Status: Implemented
- Requirements: Track stockQuantity, variant quantities, StockLog entries for changes, stock adjustment API
- Acceptance criteria: adjustStock updates inventory and creates StockLog entries; negative stock prevented
- Dependencies: productController.adjustStock, StockLog model

8. Offers & Loyalty
- Status: Implemented (CustomerLevel, SpecialOffer present)
- Requirements: Special offers with product lists, customer levels with rewards; apply loyalty discounts during checkout
- Acceptance criteria: SpecialOffer.isActive toggles discounts; customer order computes loyaltyDiscount correctly
- Dependencies: SpecialOffer, CustomerLevel models, order controller

9. Returns & Refunds
- Status: Implemented (models present)
- Requirements: CustomerReturn and SupplierReturn handling, refund processing, inventory adjustments
- Acceptance criteria: return creates CustomerReturn record, updates inventory accordingly, and processes refund method
- Dependencies: CustomerReturn, SupplierReturn models, orderController, refund flow with payment providers

10. Accounting & Financials
- Status: Implemented (models & controllers exist)
- Requirements: Journal entries, cash transactions, account balances, period closing
- Acceptance criteria: posting a CashTransaction updates FinancialAccount balances; JournalEntry lines sum to zero (debit==credit)
- Dependencies: JournalEntry, JournalLine, FinancialAccount models, accountingPostingEngine

11. Reporting & Analytics
- Status: In Progress / Planned
- Requirements: Sales reports, stock reports, profit distribution reports, tax filing data export
- Acceptance criteria: generate report for date range with downloadable CSV; stock report lists low-stock SKUs
- Dependencies: aggregation queries, possibly materialized tables or scheduled jobs

12. Shipping & Fulfillment
- Status: Implemented (ShippingConfig model)
- Requirements: Compute shipping fees, free shipping threshold, store shipping config
- Acceptance criteria: checkout displays correct shipping cost for address city; admin can update shipping config
- Dependencies: ShippingConfig model, orderController

13. Notifications & Emails
- Status: Planned
- Requirements: Order confirmation emails, password reset emails, admin alerts for low stock
- Acceptance criteria: system can enqueue and send email; templates exist
- Dependencies: Email provider (SendGrid/Mailgun), background worker or transactional email service

14. Security & Compliance
- Status: In Progress
- Requirements: Rate limiting, CSP headers, secure cookie handling, logging, backups
- Acceptance criteria: auth endpoints rate-limited; CSP and security headers applied; secrets stored in secret manager

15. Developer experience
- Status: Implemented (basic)
- Requirements: Seed script, prisma migrations, dev scripts (npm run dev), README with setup
- Acceptance criteria: repo can be bootstrapped locally using README steps

-- End of FEATURES_CATALOG.md --
