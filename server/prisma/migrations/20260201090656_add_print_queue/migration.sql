/*
  Warnings:

  - You are about to alter the column `sellingPrice` on the `Part` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - You are about to alter the column `totalPrice` on the `Repair` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - You are about to alter the column `unitPrice` on the `RepairItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - You are about to alter the column `price` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - Made the column `name` on table `Part` required. This step will fail if there are existing NULL values in that column.
  - Made the column `costPrice` on table `Part` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand` on table `Part` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `phoneNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Part` MODIFY `name` VARCHAR(191) NOT NULL,
    ALTER COLUMN `stockQuantity` DROP DEFAULT,
    ALTER COLUMN `minStockLevel` DROP DEFAULT,
    MODIFY `costPrice` INTEGER NOT NULL,
    MODIFY `sellingPrice` INTEGER NOT NULL,
    MODIFY `brand` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Repair` MODIFY `totalPrice` INTEGER NOT NULL,
    MODIFY `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'CREDIT_CARD') NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE `RepairItem` MODIFY `unitPrice` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Service` MODIFY `price` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `phoneNumber` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `PrintQueue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `repairId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PRINTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `printedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
