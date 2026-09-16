-- AlterTable
ALTER TABLE `cashtransaction` ADD COLUMN `invoiceNumber` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `partyName` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `customerlevel` MODIFY `badgeIcon` VARCHAR(191) NOT NULL DEFAULT '🥉';

-- AlterTable
ALTER TABLE `fixedasset` ADD COLUMN `invoiceNumber` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `paidFromAccountId` VARCHAR(191) NULL,
    ADD COLUMN `payableAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `payableId` VARCHAR(191) NULL,
    ADD COLUMN `vendorName` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `inboundshipment` ADD COLUMN `invoiceNumber` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `paidFromAccountId` VARCHAR(191) NULL,
    ADD COLUMN `payableAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `payableId` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PAID',
    ADD COLUMN `supplierName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `totalItemsCost` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalLandedCost` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `investorliability` ADD COLUMN `disbursementAccountId` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `interestPaid` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `loanSchedule` JSON NOT NULL,
    ADD COLUMN `loanTermMonths` INTEGER NULL DEFAULT 12,
    ADD COLUMN `loanType` VARCHAR(191) NULL DEFAULT 'TERM_LOAN',
    ADD COLUMN `principalPaid` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalInterestPayable` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `assignmentId` VARCHAR(191) NULL,
    ADD COLUMN `deliveryJobId` VARCHAR(191) NULL,
    ADD COLUMN `directNotes` TEXT NULL,
    ADD COLUMN `directOrderType` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `fulfillmentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    ADD COLUMN `manufacturerId` VARCHAR(191) NULL,
    ADD COLUMN `orderType` VARCHAR(191) NOT NULL DEFAULT 'ONLINE_STORE';

-- AlterTable
ALTER TABLE `partnerequity` ADD COLUMN `investmentHistory` JSON NOT NULL,
    ADD COLUMN `isPrimaryPartner` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'PARTNER',
    ADD COLUMN `shareCount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `sharePrice` DOUBLE NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE `specialoffer` MODIFY `badgeText` VARCHAR(191) NOT NULL DEFAULT '🎉 FESTIVE OFFER';

-- CreateTable
CREATE TABLE `CompanyValuation` (
    `id` VARCHAR(191) NOT NULL,
    `roundName` VARCHAR(191) NOT NULL,
    `effectiveDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `preMoneyValuation` DOUBLE NOT NULL DEFAULT 0,
    `investmentAmount` DOUBLE NOT NULL DEFAULT 0,
    `postMoneyValuation` DOUBLE NOT NULL DEFAULT 0,
    `totalPreShares` DOUBLE NOT NULL DEFAULT 0,
    `newSharesIssued` DOUBLE NOT NULL DEFAULT 0,
    `totalPostShares` DOUBLE NOT NULL DEFAULT 0,
    `sharePrice` DOUBLE NOT NULL DEFAULT 100,
    `valuationMethod` VARCHAR(191) NOT NULL DEFAULT 'EQUITY_ROUND',
    `leadInvestor` VARCHAR(191) NULL DEFAULT '',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShareTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `fromPartnerId` VARCHAR(191) NULL,
    `fromPartnerName` VARCHAR(191) NULL DEFAULT '',
    `toPartnerId` VARCHAR(191) NULL,
    `toPartnerName` VARCHAR(191) NULL DEFAULT '',
    `shareCount` DOUBLE NOT NULL,
    `sharePrice` DOUBLE NOT NULL DEFAULT 100,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `equityPercentageTransferred` DOUBLE NOT NULL DEFAULT 0,
    `depositAccountId` VARCHAR(191) NULL,
    `settlementType` VARCHAR(191) NOT NULL DEFAULT 'COMPANY_TREASURY',
    `valuationRoundId` VARCHAR(191) NULL DEFAULT '',
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountPayable` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `payeeName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'OPERATING_EXPENSE',
    `referenceType` VARCHAR(191) NULL DEFAULT 'MANUAL',
    `referenceId` VARCHAR(191) NULL DEFAULT '',
    `totalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `remainingBalance` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `invoiceNumber` VARCHAR(191) NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `notes` TEXT NULL,
    `settlementHistory` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AccountPayable_status_idx`(`status`),
    INDEX `AccountPayable_dueDate_idx`(`dueDate`),
    INDEX `AccountPayable_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountReceivable` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `payerName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'CUSTOMER_RECEIVABLE',
    `referenceType` VARCHAR(191) NULL DEFAULT 'MANUAL',
    `referenceId` VARCHAR(191) NULL DEFAULT '',
    `totalAmount` DOUBLE NOT NULL,
    `receivedAmount` DOUBLE NOT NULL DEFAULT 0,
    `remainingBalance` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `invoiceNumber` VARCHAR(191) NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
    `notes` TEXT NULL,
    `collectionHistory` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AccountReceivable_status_idx`(`status`),
    INDEX `AccountReceivable_dueDate_idx`(`dueDate`),
    INDEX `AccountReceivable_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `accountCode` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `normalBalance` VARCHAR(191) NOT NULL,
    `parentAccountId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `isSystemAccount` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Account_accountCode_key`(`accountCode`),
    INDEX `Account_accountType_idx`(`accountType`),
    INDEX `Account_parentAccountId_idx`(`parentAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FiscalYear` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FiscalYear_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountingPeriod` (
    `id` VARCHAR(191) NOT NULL,
    `fiscalYearId` VARCHAR(191) NOT NULL,
    `periodName` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AccountingPeriod_fiscalYearId_periodName_key`(`fiscalYearId`, `periodName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` VARCHAR(191) NOT NULL,
    `journalNumber` VARCHAR(191) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fiscalYearId` VARCHAR(191) NULL,
    `accountingPeriodId` VARCHAR(191) NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'POSTED',
    `reversedEntryId` VARCHAR(191) NULL,
    `reversalReason` TEXT NULL,
    `totalDebit` DOUBLE NOT NULL DEFAULT 0,
    `totalCredit` DOUBLE NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL DEFAULT 'system',
    `postedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `JournalEntry_journalNumber_key`(`journalNumber`),
    UNIQUE INDEX `JournalEntry_idempotencyKey_key`(`idempotencyKey`),
    INDEX `JournalEntry_transactionDate_idx`(`transactionDate`),
    INDEX `JournalEntry_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `JournalEntry_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalLine` (
    `id` VARCHAR(191) NOT NULL,
    `journalEntryId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `debit` DOUBLE NOT NULL DEFAULT 0,
    `credit` DOUBLE NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL DEFAULT '',
    `supplierId` VARCHAR(191) NULL,
    `supplierName` VARCHAR(191) NULL DEFAULT '',
    `productId` VARCHAR(191) NULL,
    `assetId` VARCHAR(191) NULL,
    `costCenter` VARCHAR(191) NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JournalLine_journalEntryId_idx`(`journalEntryId`),
    INDEX `JournalLine_accountId_idx`(`accountId`),
    INDEX `JournalLine_customerId_idx`(`customerId`),
    INDEX `JournalLine_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Manufacturer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `qualityRating` DOUBLE NOT NULL DEFAULT 5.0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `contractStatus` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `contractDocUrl` TEXT NULL,
    `contractStartDate` DATETIME(3) NULL,
    `contractExpiryDate` DATETIME(3) NULL,
    `agreementNotes` TEXT NULL,
    `totalOrdersFulfilled` INTEGER NOT NULL DEFAULT 0,
    `onTimeCount` INTEGER NOT NULL DEFAULT 0,
    `defectCount` INTEGER NOT NULL DEFAULT 0,
    `rejectionCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Manufacturer_email_key`(`email`),
    INDEX `Manufacturer_city_idx`(`city`),
    INDEX `Manufacturer_isActive_isAvailable_idx`(`isActive`, `isAvailable`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManufacturerInventory` (
    `id` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `reservedQty` INTEGER NOT NULL DEFAULT 0,
    `variantsStock` JSON NOT NULL,
    `proposedCostPrice` DOUBLE NULL,
    `agreedCostPrice` DOUBLE NULL,
    `priceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `priceNote` TEXT NULL,
    `adminFeedback` TEXT NULL,
    `lastUpdated` DATETIME(3) NOT NULL,

    INDEX `ManufacturerInventory_productId_idx`(`productId`),
    INDEX `ManufacturerInventory_manufacturerId_idx`(`manufacturerId`),
    UNIQUE INDEX `ManufacturerInventory_manufacturerId_productId_key`(`manufacturerId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `manufacturingAt` DATETIME(3) NULL,
    `qualityCheckAt` DATETIME(3) NULL,
    `packedAt` DATETIME(3) NULL,
    `readyAt` DATETIME(3) NULL,
    `pickedUpAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `rejectionReason` VARCHAR(191) NULL,

    UNIQUE INDEX `OrderAssignment_orderId_key`(`orderId`),
    INDEX `OrderAssignment_orderId_idx`(`orderId`),
    INDEX `OrderAssignment_manufacturerId_idx`(`manufacturerId`),
    INDEX `OrderAssignment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryOrder` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL DEFAULT 'READY_TO_DELIVER',
    `deliveryType` VARCHAR(191) NOT NULL DEFAULT 'Door2Door',
    `packageVersion` INTEGER NOT NULL DEFAULT 1,
    `packageWeight` DOUBLE NOT NULL DEFAULT 1,
    `packageDescription` TEXT NULL,
    `originBranchName` VARCHAR(191) NOT NULL,
    `destinationBranchName` VARCHAR(191) NOT NULL,
    `itemAmount` DOUBLE NOT NULL DEFAULT 0,
    `customerDeliveryCharge` DOUBLE NOT NULL DEFAULT 0,
    `ncmDeliveryCharge` DOUBLE NULL,
    `codAmount` DOUBLE NOT NULL DEFAULT 0,
    `ncmOrderId` INTEGER NULL,
    `vendorReference` VARCHAR(191) NOT NULL,
    `ncmStatus` VARCHAR(191) NULL,
    `ncmPaymentStatus` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `nextSyncAt` DATETIME(3) NULL,
    `syncFailureCount` INTEGER NOT NULL DEFAULT 0,
    `lastSyncError` TEXT NULL,
    `readyAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ncmCreatedAt` DATETIME(3) NULL,
    `pickedUpAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryOrder_orderId_key`(`orderId`),
    UNIQUE INDEX `DeliveryOrder_ncmOrderId_key`(`ncmOrderId`),
    UNIQUE INDEX `DeliveryOrder_vendorReference_key`(`vendorReference`),
    INDEX `DeliveryOrder_state_idx`(`state`),
    INDEX `DeliveryOrder_manufacturerId_state_idx`(`manufacturerId`, `state`),
    INDEX `DeliveryOrder_nextSyncAt_idx`(`nextSyncAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryEvent` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryOrderId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `fromState` VARCHAR(191) NULL,
    `toState` VARCHAR(191) NULL,
    `ncmStatus` VARCHAR(191) NULL,
    `payloadJson` JSON NULL,
    `actorId` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idempotencyKey` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `DeliveryEvent_idempotencyKey_key`(`idempotencyKey`),
    INDEX `DeliveryEvent_deliveryOrderId_occurredAt_idx`(`deliveryOrderId`, `occurredAt`),
    INDEX `DeliveryEvent_orderId_occurredAt_idx`(`orderId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NcmRequestAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryOrderId` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `requestUrl` VARCHAR(191) NOT NULL,
    `requestJson` JSON NULL,
    `responseJson` JSON NULL,
    `httpStatus` INTEGER NULL,
    `result` VARCHAR(191) NOT NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,

    UNIQUE INDEX `NcmRequestAttempt_idempotencyKey_key`(`idempotencyKey`),
    INDEX `NcmRequestAttempt_deliveryOrderId_operation_idx`(`deliveryOrderId`, `operation`),
    INDEX `NcmRequestAttempt_result_nextRetryAt_idx`(`result`, `nextRetryAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NcmWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventKey` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `orderIds` JSON NULL,
    `status` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NULL,
    `payloadJson` JSON NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processingStatus` VARCHAR(191) NOT NULL DEFAULT 'RECEIVED',
    `processingError` TEXT NULL,

    UNIQUE INDEX `NcmWebhookEvent_eventKey_key`(`eventKey`),
    INDEX `NcmWebhookEvent_orderId_idx`(`orderId`),
    INDEX `NcmWebhookEvent_processingStatus_receivedAt_idx`(`processingStatus`, `receivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryReturn` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryOrderId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL DEFAULT 'RETURN_REQUESTED',
    `returnReason` VARCHAR(191) NOT NULL,
    `ncmReturnComment` TEXT NULL,
    `ncmReturnRequestedAt` DATETIME(3) NULL,
    `trackingReference` VARCHAR(191) NULL,
    `receivedAt` DATETIME(3) NULL,
    `inspectedAt` DATETIME(3) NULL,
    `inspectionResult` VARCHAR(191) NULL,
    `restockDecision` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryReturn_deliveryOrderId_key`(`deliveryOrderId`),
    INDEX `DeliveryReturn_manufacturerId_state_idx`(`manufacturerId`, `state`),
    INDEX `DeliveryReturn_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryFinancialSettlement` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryOrderId` VARCHAR(191) NOT NULL,
    `ncmOrderId` INTEGER NULL,
    `codExpected` DOUBLE NOT NULL DEFAULT 0,
    `codCollected` DOUBLE NOT NULL DEFAULT 0,
    `deliveryFeeExpected` DOUBLE NOT NULL DEFAULT 0,
    `deliveryFeeActual` DOUBLE NOT NULL DEFAULT 0,
    `otherAdjustments` DOUBLE NOT NULL DEFAULT 0,
    `manufacturerPayable` DOUBLE NOT NULL DEFAULT 0,
    `platformReceivable` DOUBLE NOT NULL DEFAULT 0,
    `ncmTicketId` INTEGER NULL,
    `settlementState` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `settledAt` DATETIME(3) NULL,
    `journalEntryId` VARCHAR(191) NULL,
    `varianceReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryFinancialSettlement_deliveryOrderId_key`(`deliveryOrderId`),
    INDEX `DeliveryFinancialSettlement_settlementState_idx`(`settlementState`),
    INDEX `DeliveryFinancialSettlement_ncmOrderId_idx`(`ncmOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperatingExpense` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `isVatBill` BOOLEAN NOT NULL DEFAULT false,
    `vatAmount` DOUBLE NOT NULL DEFAULT 0,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'CASH',
    `vendorName` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OperatingExpense_category_idx`(`category`),
    INDEX `OperatingExpense_date_idx`(`date`),
    INDEX `OperatingExpense_isVatBill_idx`(`isVatBill`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CashTransaction_date_idx` ON `CashTransaction`(`date`);

-- CreateIndex
CREATE INDEX `CashTransaction_category_idx` ON `CashTransaction`(`category`);

-- CreateIndex
CREATE INDEX `CashTransaction_type_idx` ON `CashTransaction`(`type`);

-- CreateIndex
CREATE INDEX `Order_fulfillmentStatus_idx` ON `Order`(`fulfillmentStatus`);

-- CreateIndex
CREATE INDEX `Order_userId_idx` ON `Order`(`userId`);

-- CreateIndex
CREATE INDEX `Order_orderType_idx` ON `Order`(`orderType`);

-- CreateIndex
CREATE INDEX `Order_manufacturerId_idx` ON `Order`(`manufacturerId`);

-- CreateIndex
CREATE INDEX `Order_date_idx` ON `Order`(`date`);

-- CreateIndex
CREATE INDEX `Order_status_idx` ON `Order`(`status`);

-- CreateIndex
CREATE INDEX `Order_payment_idx` ON `Order`(`payment`);

-- CreateIndex
CREATE INDEX `Product_published_idx` ON `Product`(`published`);

-- CreateIndex
CREATE INDEX `Product_category_idx` ON `Product`(`category`);

-- CreateIndex
CREATE INDEX `Product_bestseller_idx` ON `Product`(`bestseller`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_parentAccountId_fkey` FOREIGN KEY (`parentAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountingPeriod` ADD CONSTRAINT `AccountingPeriod_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `FiscalYear`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalLine` ADD CONSTRAINT `JournalLine_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `JournalEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalLine` ADD CONSTRAINT `JournalLine_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManufacturerInventory` ADD CONSTRAINT `ManufacturerInventory_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `Manufacturer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderAssignment` ADD CONSTRAINT `OrderAssignment_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `Manufacturer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
