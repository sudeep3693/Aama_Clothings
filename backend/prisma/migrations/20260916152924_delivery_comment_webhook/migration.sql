-- AlterTable
ALTER TABLE `customerlevel` MODIFY `badgeIcon` VARCHAR(191) NOT NULL DEFAULT '🥉';

-- AlterTable
ALTER TABLE `specialoffer` MODIFY `badgeText` VARCHAR(191) NOT NULL DEFAULT '🎉 FESTIVE OFFER';

-- CreateTable
CREATE TABLE `DeliveryComment` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryOrderId` VARCHAR(191) NULL,
    `ncmOrderId` INTEGER NOT NULL,
    `comments` TEXT NOT NULL,
    `addedBy` VARCHAR(191) NULL,
    `addedAt` DATETIME(3) NULL,
    `payloadJson` JSON NOT NULL,
    `eventKey` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeliveryComment_eventKey_key`(`eventKey`),
    INDEX `DeliveryComment_deliveryOrderId_createdAt_idx`(`deliveryOrderId`, `createdAt`),
    INDEX `DeliveryComment_ncmOrderId_createdAt_idx`(`ncmOrderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
