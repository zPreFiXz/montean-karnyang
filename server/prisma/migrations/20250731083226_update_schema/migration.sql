/*
  Warnings:

  - You are about to drop the `RepairPart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepairService` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `paymentMethod` on table `Repair` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `categoryId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `RepairPart` DROP FOREIGN KEY `RepairPart_partId_fkey`;

-- DropForeignKey
ALTER TABLE `RepairPart` DROP FOREIGN KEY `RepairPart_repairId_fkey`;

-- DropForeignKey
ALTER TABLE `RepairService` DROP FOREIGN KEY `RepairService_repairId_fkey`;

-- DropForeignKey
ALTER TABLE `RepairService` DROP FOREIGN KEY `RepairService_serviceId_fkey`;

-- AlterTable
ALTER TABLE `Part` ALTER COLUMN `minStockLevel` DROP DEFAULT,
    MODIFY `partNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Repair` MODIFY `paymentMethod` ENUM('CASH', 'CREDIT_CARD', 'BANK_TRANSFER') NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE `Service` ADD COLUMN `categoryId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `RepairPart`;

-- DropTable
DROP TABLE `RepairService`;

-- CreateTable
CREATE TABLE `RepairItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitPrice` DECIMAL(65, 30) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `repairId` INTEGER NOT NULL,
    `partId` INTEGER NULL,
    `serviceId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RepairItem` ADD CONSTRAINT `RepairItem_repairId_fkey` FOREIGN KEY (`repairId`) REFERENCES `Repair`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepairItem` ADD CONSTRAINT `RepairItem_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepairItem` ADD CONSTRAINT `RepairItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
