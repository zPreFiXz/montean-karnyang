-- AlterTable
ALTER TABLE `RepairItem` ADD COLUMN `dotCode` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TireLot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dotCode` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `partId` INTEGER NOT NULL,

    INDEX `TireLot_partId_idx`(`partId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TireLot` ADD CONSTRAINT `TireLot_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
