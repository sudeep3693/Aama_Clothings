-- AlterTable
ALTER TABLE `CustomerLevel` MODIFY `badgeIcon` VARCHAR(191) NOT NULL DEFAULT '🥉';

-- AlterTable
ALTER TABLE `SpecialOffer` MODIFY `badgeText` VARCHAR(191) NOT NULL DEFAULT '🎉 FESTIVE OFFER';

-- CreateTable
CREATE TABLE `FinancialAccount` (
    `id` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL DEFAULT 'BANK',
    `accountNumber` VARCHAR(191) NULL DEFAULT '',
    `bankName` VARCHAR(191) NULL DEFAULT '',
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'NPR',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FinancialAccount_accountName_key`(`accountName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fromAccountId` VARCHAR(191) NULL,
    `toAccountId` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL DEFAULT '',
    `description` TEXT NULL,
    `receiptUrl` VARCHAR(191) NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FixedAsset` (
    `id` VARCHAR(191) NOT NULL,
    `assetName` VARCHAR(191) NOT NULL,
    `assetTag` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `purchaseCost` DOUBLE NOT NULL,
    `salvageValue` DOUBLE NOT NULL DEFAULT 0,
    `usefulLifeMonths` INTEGER NOT NULL DEFAULT 60,
    `depreciationMethod` VARCHAR(191) NOT NULL DEFAULT 'WRITTEN_DOWN_VALUE_SLAB',
    `depreciationRate` DOUBLE NOT NULL DEFAULT 25,
    `accumulatedDepreciation` DOUBLE NOT NULL DEFAULT 0,
    `currentBookValue` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `damageNotes` TEXT NULL,
    `disposalDate` DATETIME(3) NULL,
    `disposalAmount` DOUBLE NULL DEFAULT 0,
    `scrapLossAmount` DOUBLE NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FixedAsset_assetTag_key`(`assetTag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerEquity` (
    `id` VARCHAR(191) NOT NULL,
    `partnerName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL DEFAULT '',
    `ownershipPercentage` DOUBLE NOT NULL,
    `initialCapital` DOUBLE NOT NULL DEFAULT 0,
    `currentCapital` DOUBLE NOT NULL DEFAULT 0,
    `totalDrawings` DOUBLE NOT NULL DEFAULT 0,
    `totalDistributionsReceived` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerEquity_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfitDistribution` (
    `id` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `fiscalYear` VARCHAR(191) NOT NULL,
    `grossRevenue` DOUBLE NOT NULL DEFAULT 0,
    `netProfit` DOUBLE NOT NULL DEFAULT 0,
    `retainedEarningsPercentage` DOUBLE NOT NULL DEFAULT 20,
    `retainedAmount` DOUBLE NOT NULL DEFAULT 0,
    `distributableAmount` DOUBLE NOT NULL DEFAULT 0,
    `partnerBreakdown` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestorLiability` (
    `id` VARCHAR(191) NOT NULL,
    `investorName` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NULL DEFAULT '',
    `contactEmail` VARCHAR(191) NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL,
    `principalAmount` DOUBLE NOT NULL,
    `amountRepaid` DOUBLE NOT NULL DEFAULT 0,
    `outstandingBalance` DOUBLE NOT NULL,
    `interestRate` DOUBLE NOT NULL DEFAULT 0,
    `monthlyInstallment` DOUBLE NULL DEFAULT 0,
    `equityGrantedPercentage` DOUBLE NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL,
    `maturityDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerReturn` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NULL DEFAULT '',
    `returnDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `items` JSON NOT NULL,
    `totalRefundAmount` DOUBLE NOT NULL DEFAULT 0,
    `vatRefunded` DOUBLE NOT NULL DEFAULT 0,
    `refundMethod` VARCHAR(191) NOT NULL DEFAULT 'CASH',
    `refundStatus` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `inventoryAction` VARCHAR(191) NOT NULL DEFAULT 'RESTOCKED',
    `reason` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierReturn` (
    `id` VARCHAR(191) NOT NULL,
    `shipmentBatchId` VARCHAR(191) NULL,
    `supplierName` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `items` JSON NOT NULL,
    `totalDebitAmount` DOUBLE NOT NULL DEFAULT 0,
    `vatReversal` DOUBLE NOT NULL DEFAULT 0,
    `settlementType` VARCHAR(191) NOT NULL DEFAULT 'CREDIT_NOTE_OFFSET_PAYABLE',
    `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `reason` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaxConfiguration` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `fiscalYear` VARCHAR(191) NOT NULL DEFAULT '2082/2083',
    `vatRate` DOUBLE NOT NULL DEFAULT 13.0,
    `corporateTaxRate` DOUBLE NOT NULL DEFAULT 25.0,
    `taxSlabs` JSON NOT NULL,
    `autoDeductAdvanceTax` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaxFilingRecord` (
    `id` VARCHAR(191) NOT NULL,
    `periodType` VARCHAR(191) NOT NULL,
    `periodKey` VARCHAR(191) NOT NULL,
    `taxableSales` DOUBLE NOT NULL DEFAULT 0,
    `outputVat` DOUBLE NOT NULL DEFAULT 0,
    `taxablePurchases` DOUBLE NOT NULL DEFAULT 0,
    `inputVat` DOUBLE NOT NULL DEFAULT 0,
    `netVatPayable` DOUBLE NOT NULL DEFAULT 0,
    `grossRevenue` DOUBLE NOT NULL DEFAULT 0,
    `totalDeductions` DOUBLE NOT NULL DEFAULT 0,
    `depreciationDeduction` DOUBLE NOT NULL DEFAULT 0,
    `taxableIncome` DOUBLE NOT NULL DEFAULT 0,
    `calculatedTax` DOUBLE NOT NULL DEFAULT 0,
    `taxPaid` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `filedDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashTransaction` ADD CONSTRAINT `CashTransaction_fromAccountId_fkey` FOREIGN KEY (`fromAccountId`) REFERENCES `FinancialAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashTransaction` ADD CONSTRAINT `CashTransaction_toAccountId_fkey` FOREIGN KEY (`toAccountId`) REFERENCES `FinancialAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
