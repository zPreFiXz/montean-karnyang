/*
  Warnings:

  - You are about to drop the column `vehicleId` on the `LicensePlate` table. All the data in the column will be lost.
  - Made the column `customerId` on table `Repair` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `LicensePlate` DROP FOREIGN KEY `LicensePlate_vehicleId_fkey`;

-- DropForeignKey
ALTER TABLE `Repair` DROP FOREIGN KEY `Repair_customerId_fkey`;

-- DropIndex
DROP INDEX `LicensePlate_vehicleId_fkey` ON `LicensePlate`;

-- DropIndex
DROP INDEX `Repair_customerId_fkey` ON `Repair`;

-- AlterTable
ALTER TABLE `LicensePlate` DROP COLUMN `vehicleId`;

-- AlterTable
ALTER TABLE `Repair` MODIFY `customerId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Vehicle` ADD COLUMN `licensePlateId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_licensePlateId_fkey` FOREIGN KEY (`licensePlateId`) REFERENCES `LicensePlate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
