-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL DEFAULT '',
    `lastName` VARCHAR(191) NULL DEFAULT '',
    `phone` VARCHAR(191) NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `cartData` JSON NOT NULL,
    `addresses` JSON NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DOUBLE NOT NULL,
    `image` JSON NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `subCategory` VARCHAR(191) NOT NULL,
    `sizes` JSON NOT NULL,
    `colors` JSON NOT NULL,
    `variants` JSON NOT NULL,
    `bestseller` BOOLEAN NOT NULL DEFAULT false,
    `newInStore` BOOLEAN NOT NULL DEFAULT false,
    `isSpecialOffer` BOOLEAN NOT NULL DEFAULT false,
    `offerTag` VARCHAR(191) NULL DEFAULT '',
    `offerEndDate` DATETIME(3) NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `costPrice` DOUBLE NOT NULL DEFAULT 0,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `date` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `amount` DOUBLE NOT NULL,
    `address` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Order Placed',
    `paymentMethod` VARCHAR(191) NOT NULL,
    `payment` BOOLEAN NOT NULL DEFAULT false,
    `date` BIGINT NOT NULL,
    `loyaltyDiscount` DOUBLE NULL DEFAULT 0,
    `rewardApplied` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SubCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Color` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Color_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL DEFAULT '',
    `comment` TEXT NOT NULL,
    `likes` JSON NOT NULL,
    `dislikes` JSON NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT true,
    `date` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingConfig` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `baseCity` VARCHAR(191) NOT NULL DEFAULT 'Kathmandu',
    `sameCityFee` DOUBLE NOT NULL DEFAULT 50,
    `differentCityFee` DOUBLE NOT NULL DEFAULT 120,
    `freeShippingMin` DOUBLE NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerLevel` (
    `id` VARCHAR(191) NOT NULL,
    `levelNumber` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `badgeIcon` VARCHAR(191) NOT NULL DEFAULT '🥉',
    `color` VARCHAR(191) NOT NULL DEFAULT '#CD7F32',
    `minSpend` DOUBLE NOT NULL DEFAULT 0,
    `minOrders` INTEGER NOT NULL DEFAULT 0,
    `rewardType` VARCHAR(191) NOT NULL DEFAULT 'CUSTOM',
    `rewardValue` DOUBLE NULL DEFAULT 0,
    `rewardTitle` VARCHAR(191) NOT NULL DEFAULT 'Welcome Reward',
    `rewardDescription` TEXT NULL,
    `rewardOrderLimit` INTEGER NOT NULL DEFAULT 3,
    `freeShipping` BOOLEAN NOT NULL DEFAULT false,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `giftAmount` DOUBLE NOT NULL DEFAULT 0,
    `giftDescription` VARCHAR(191) NULL DEFAULT '',
    `letterIncluded` BOOLEAN NOT NULL DEFAULT false,
    `customPerk` VARCHAR(191) NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomerLevel_levelNumber_key`(`levelNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerLetterImage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL DEFAULT 'Letter / Handwritten Note',
    `notes` TEXT NULL,
    `orderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialOffer` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL DEFAULT 'Exclusive festive deals and limited-time discounts',
    `badgeText` VARCHAR(191) NOT NULL DEFAULT '🎉 FESTIVE OFFER',
    `bannerImage` VARCHAR(191) NULL DEFAULT '',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `discount` DOUBLE NULL DEFAULT 0,
    `productIds` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockLog` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `variantLabel` VARCHAR(191) NULL DEFAULT '',
    `previousQty` INTEGER NOT NULL,
    `newQty` INTEGER NOT NULL,
    `changeQty` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `orderId` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InboundShipment` (
    `id` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NOT NULL,
    `carrier` VARCHAR(191) NOT NULL DEFAULT 'Local Freight',
    `shipmentDate` DATETIME(3) NOT NULL,
    `totalFreightCost` DOUBLE NOT NULL DEFAULT 0,
    `customsOrTaxes` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `items` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InboundShipment_batchNumber_key`(`batchNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyExpense` (
    `id` VARCHAR(191) NOT NULL,
    `yearMonth` VARCHAR(191) NOT NULL,
    `marketingSpend` DOUBLE NOT NULL DEFAULT 0,
    `officeRent` DOUBLE NOT NULL DEFAULT 0,
    `utilities` DOUBLE NOT NULL DEFAULT 0,
    `salaries` DOUBLE NOT NULL DEFAULT 0,
    `softwareTools` DOUBLE NOT NULL DEFAULT 0,
    `packagingCostPerUnit` DOUBLE NOT NULL DEFAULT 20,
    `miscExpenses` DOUBLE NOT NULL DEFAULT 0,
    `projectedMonthlyUnits` INTEGER NOT NULL DEFAULT 300,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonthlyExpense_yearMonth_key`(`yearMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
