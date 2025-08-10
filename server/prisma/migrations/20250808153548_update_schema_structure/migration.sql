/*
  Warnings:

  - You are about to drop the column `lotNumber` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `RepairItem` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Vehicle` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `Part` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Part` DROP FOREIGN KEY `Part_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `Vehicle` DROP FOREIGN KEY `Vehicle_customerId_fkey`;

-- DropIndex
DROP INDEX `Part_categoryId_fkey` ON `Part`;

-- DropIndex
DROP INDEX `Vehicle_customerId_fkey` ON `Vehicle`;

-- AlterTable
ALTER TABLE `Part` DROP COLUMN `lotNumber`,
    MODIFY `name` VARCHAR(191) NULL,
    MODIFY `costPrice` DECIMAL(65, 30) NULL,
    MODIFY `categoryId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Repair` ADD COLUMN `customerId` INTEGER NULL;

-- AlterTable
ALTER TABLE `RepairItem` DROP COLUMN `description`;

-- AlterTable
ALTER TABLE `Vehicle` DROP COLUMN `customerId`;

-- AddForeignKey
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
