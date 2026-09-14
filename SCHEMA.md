# SCHEMA.md

Repository path: backend/prisma/schema.prisma

This document describes the database schema as implemented in backend/prisma/schema.prisma (Prisma / MySQL). It lists models, fields, types, primary/unique constraints, relations, indexes and pragmatic notes about JSON fields and validation rules observed in application controllers.

-- Summary --
- Primary database: MySQL via Prisma (datasource provider = "mysql").
- Many models use JSON columns for flexible compound data (images, variants, cartData, addresses).
- Several accounting and finance models form a financial subdomain (JournalEntry, JournalLine, Account, FiscalYear, etc.).
- Some relations are modeled explicitly with Prisma relations; many refer to other entities by raw ID (String) and are treated as foreign keys at application level.

--- Models (alphabetical) ---

User
- Table: User
- Primary Key: id (String, uuid)
- Fields:
  - id: String @id @default(uuid())
  - firstName: String? @default("")
  - lastName: String? @default("")
  - phone: String? @default("")
  - name: String (full name)
  - email: String @unique (lowercased by controller)
  - password: String (bcrypt hash)
  - cartData: Json @default("{}") — cart stored as JSON map { productId: { variantKey: qty } }
  - addresses: Json @default("[]") — array of address objects
- Observed constraints/validation:
  - email uniqueness enforced by DB and controller validates format (validator.isEmail).
  - password minimum length enforced at registration (>=8) and stored hashed.
  - controllers parse JSON fields defensively (parseJsonArray) and limit addresses to 5.

Product
- Table: Product
- Primary Key: id (String, uuid)
- Fields:
  - id, name (String)
  - description: String @db.Text
  - price: Float
  - image: Json (array of image URLs)
  - category: String (stringified JSON array in controllers, stored as string)
  - subCategory: String
  - sizes: Json
  - colors: Json @default("[]")
  - variants: Json @default("[]") — variant objects include size, color, quantity, SKU
  - bestseller: Boolean @default(false)
  - newInStore: Boolean @default(false)
  - isSpecialOffer, offerTag, offerEndDate, discount, costPrice, stockQuantity, lowStockThreshold, published, date (BigInt)
- Observed constraints/validation:
  - Controllers normalize categories and JSON-parsed fields; price/discount/costPrice coercions applied.
  - When newInStore is set true, code enforces uniqueness by unsetting others (application-level exclusivity).
  - published determines public visibility; listing endpoints filter by published unless admin.
  - Images are uploaded to Cloudinary and stored as secure URLs in image JSON.

Order
- Table: Order
- Primary Key: id (String, uuid)
- Fields: userId (String), items (Json), amount (Float), address (Json), status (String @default("Order Placed")), paymentMethod (String), payment (Boolean), date (BigInt), loyaltyDiscount Float?, rewardApplied Json?
- Observed:
  - Items stored as JSON; payment booleans and paymentMethod tracked. Controller and admin logic use order.status lifecycle.

Category / SubCategory / Color
- Simple lookup tables with id (uuid) and name (unique).

Review
- Table: Review
- Primary Key: id
- Fields: productId, userId, userName, userEmail, rating (Int), title, comment (Text), likes/dislikes Json arrays, verified Boolean, date BigInt
- Observed:
  - Used to compute product ratings in controllers; review aggregation is done in-memory for endpoints.

ShippingConfig
- Singleton-like configuration model with id default "default" and fees, freeShippingMin, updatedAt @updatedAt

CustomerLevel, CustomerLetterImage, SpecialOffer
- Customer loyalty and marketing models; CustomerLevel contains reward configuration fields (minSpend, minOrders, rewardType, etc.)
- SpecialOffer tracks active promotions and productIds as JSON array

StockLog
- Records stock movements: productId, productName, variantLabel, previousQty, newQty, changeQty, reason, orderId?, source, createdAt
- Used by controllers to log adjustments and initial stock

InboundShipment, MonthlyExpense
- Supply chain and cost bookkeeping models, with items stored as JSON arrays

Admin
- Table: Admin
- Primary Key: id
- Fields: email @unique, password (bcrypt), timestamps
- Observed: Admin login uses AES-decrypted password in transit then bcrypt compare; JWT signed with role: "admin"

Financial + Accounting Subdomain
- FinancialAccount
  - id, accountName @unique, accountType, currentBalance, currency, isDefault, status
  - Relations: outflows and inflows with CashTransaction (@relation names FromAccount and ToAccount)
- CashTransaction
  - Fields: fromAccountId, toAccountId, fromAccount/toAccount relations reference FinancialAccount with onDelete: SetNull
- Account (Chart of Accounts)
  - Self-relation parentAccount/subAccounts (AccountHierarchy)
  - Indexes: @@index([accountType]), @@index([parentAccountId])
- FiscalYear, AccountingPeriod (relation AccountingPeriod.fiscalYear -> FiscalYear)
  - AccountingPeriod has unique([fiscalYearId, periodName])
- JournalEntry, JournalLine
  - JournalEntry has unique journalNumber, several @@index declarations: transactionDate, [sourceType, sourceId], status
  - JournalLine relates to JournalEntry (onDelete Cascade) and Account (onDelete Restrict); indexes on journalEntryId, accountId, customerId, supplierId
- CashTransaction, FixedAsset, PartnerEquity, CompanyValuation, ShareTransaction, ProfitDistribution, InvestorLiability, CustomerReturn, SupplierReturn, TaxConfiguration, TaxFilingRecord, AccountPayable, AccountReceivable, Account, FiscalYear, AccountingPeriod, JournalEntry, JournalLine: these models form the finance ledger and reporting domain and contain many JSON fields for histories and schedules.

Indexing (explicit in Prisma schema)
- Account: @@index([accountType]) and @@index([parentAccountId])
- JournalEntry: @@index([transactionDate]), @@index([sourceType, sourceId]), @@index([status])
- JournalLine: @@index([journalEntryId]), @@index([accountId]), @@index([customerId]), @@index([supplierId])
- AccountingPeriod: @@unique([fiscalYearId, periodName])

Pragmatic notes on relations vs. raw IDs
- Many models store related entity IDs as plain String fields rather than using Prisma relation() syntax. Examples: Order.userId (no explicit relation), Product references in StockLog.productId, Review.productId.
- A few relations use Prisma relation declarations (e.g., AccountingPeriod -> FiscalYear, JournalLine -> JournalEntry and Account, FinancialAccount -> CashTransaction).
- Application code often performs lookups manually (prisma.product.findUnique / prisma.user.findUnique) by ID.

JSON fields and usage patterns
- cartData (User.cartData): controller treats as nested mapping { productId: { variantKey: quantity } } and uses structuredClone when mutating.
- addresses (User.addresses): an array of address objects; controllers limit number of saved addresses to 5.
- product.image, product.variants, product.sizes, product.colors: stored as Json and normalized via helper functions to arrays before use.
- SpecialOffer.productIds: array of product IDs as Json

Timestamps and date representations
- Many models use DateTime fields with defaults (now()) for createdAt/updatedAt.
- Some models use BigInt for epoch milliseconds (e.g., Product.date, Review.date, Order.date). Controllers convert BigInt to Number when returning JSON.

Validation and business rules (observed in controllers)
- User registration: email validated via validator.isEmail; password length >= 8; phone length >= 7 optional.
- Login: client encrypts password with AES and server decrypts using AES_SECRET_KEY (decryptAES utility), then bcrypt compare.
- Product creation/update: images upload to Cloudinary; category normalized to array and stored as JSON string; if newInStore true, other products set to false (application-level uniqueness requirement).
- Stock: variants may include per-variant quantity; adjustStock handles both variant-level adjustments and product-level adjustments and writes StockLog entries; controllers ensure stock never drops negative (Math.max(0,...)).
- Addresses: saved with id = Date.now().toString(); max 5 addresses enforced.
- Admin: admin JWT payload contains role "admin" (used by auth middleware).

Foreign key behaviors and referential integrity
- Where Prisma relations exist, onDelete behavior varies: Cascade for JournalLine -> JournalEntry; SetNull for CashTransaction -> FinancialAccount. For raw ID references, enforcement is at application level — consider adding foreign key constraints or Prisma relations for stronger integrity if desired.

Caching layer
- No Redis or caching layer found in repository. If introducing Redis, suggested key patterns:
  - product:{id} => product JSON (ttl: 5–60 minutes for product lists)
  - product:list:published => sorted set or cache for homepage
  - user:{id}:cart => cartData JSON (short TTL + write-through on cart update)
  - stocklog:product:{id}:recent => list (LRANGE) for recent movements

Suggested indexes (not present but recommended)
- Product(published, date) composite index for fast listing
- Product(category) or a join table if categories are heavily queried (currently category stored as string/JSON)
- Review(productId, rating) index for efficient aggregation
- Order(userId, date) index for fetching user order history

Migration note
- Prisma datasource uses MySQL (DATABASE_URL). Despite README and presence of a mongodb config file (backend/config/mongodb.js), controllers use prisma throughout. The project appears migrated from Mongo/Mongoose to Prisma/MySQL; confirm DB provider before deploying.

Data access patterns
- Controllers query prisma.*.findUnique and findMany frequently, then post-process JSON fields.
- Aggregation (e.g., average rating) is done in-memory by the API (findMany reviews then compute ratings). For scale, consider DB-level aggregation queries or materialized counters on the product row.

Security-sensitive fields
- Passwords (User.password, Admin.password): bcrypt-hashed
- AES_SECRET_KEY used to decrypt client-sent encrypted password payloads — ensure AES_SECRET_KEY is strong and not leaked.

Distributed Manufacturing & Logistics Domain (Models)
- Manufacturer
  - Table: Manufacturer
  - Primary Key: id (String, uuid)
  - Fields: businessName, email @unique, password (bcrypt), phone, address, city, isAvailable (Boolean @default(true)), qualityRating (Float @default(5.0)), qualityNotes (Text?), contractStatus (String @default("ACTIVE")), contractDocUrl (String?), contractStart (DateTime?), contractEnd (DateTime?), commissionRate (Float @default(12.0)), totalOrdersHandled (Int @default(0)), createdAt, updatedAt
  - Relations: inventories (ManufacturerInventory[]), assignments (OrderAssignment[])

- ManufacturerInventory
  - Table: ManufacturerInventory
  - Primary Key: id (String, uuid)
  - Fields: manufacturerId, productId, quantity (Int @default(0)), reservedQty (Int @default(0)), lowStockThreshold (Int @default(5)), restockNote (String?), createdAt, updatedAt
  - Constraints: @@unique([manufacturerId, productId])
  - Relations: manufacturer (Manufacturer), product (Product)

- OrderAssignment
  - Table: OrderAssignment
  - Primary Key: id (String, uuid)
  - Fields: orderId @unique, manufacturerId, status (String @default("assigned")), declineReason (String?), packagingNotes (String?), packageWeight (String?), packageDimensions (String?), assignedAt, acceptedAt, packagedAt, deliveredAt, createdAt, updatedAt
  - Relations: order (Order), manufacturer (Manufacturer), deliveryJob (DeliveryJob?)

- DeliveryPartner
  - Table: DeliveryPartner
  - Primary Key: id (String, uuid)
  - Fields: name, email @unique, password (bcrypt), phone, city, vehicleType (String @default("BIKE")), isAvailable (Boolean @default(true)), totalDeliveries (Int @default(0)), createdAt, updatedAt
  - Relations: jobs (DeliveryJob[])

- DeliveryJob
  - Table: DeliveryJob
  - Primary Key: id (String, uuid)
  - Fields: orderAssignmentId @unique, deliveryPartnerId, status (String @default("assigned")), pickupAddress (Text?), deliveryAddress (Text?), codAmount (Float @default(0)), isCodCollected (Boolean @default(false)), proofOfDelivery (String?), recipientName (String?), deliveryNotes (Text?), failureReason (String?), assignedAt, pickedUpAt, deliveredAt, createdAt, updatedAt
  - Relations: orderAssignment (OrderAssignment), deliveryPartner (DeliveryPartner)

Appendix: Quick model map (names only)
User, Product, Order, Category, SubCategory, Color, Review, ShippingConfig, CustomerLevel, CustomerLetterImage, SpecialOffer, StockLog, InboundShipment, MonthlyExpense, Admin, FinancialAccount, CashTransaction, FixedAsset, PartnerEquity, CompanyValuation, ShareTransaction, ProfitDistribution, InvestorLiability, CustomerReturn, SupplierReturn, TaxConfiguration, TaxFilingRecord, AccountPayable, AccountReceivable, Account, FiscalYear, AccountingPeriod, JournalEntry, JournalLine, Manufacturer, ManufacturerInventory, OrderAssignment, DeliveryPartner, DeliveryJob

-- End of SCHEMA.md --

Note: SCHEMA.md was generated from backend/prisma/schema.prisma and cross-verified against backend/controllers/*.js where relevant.
