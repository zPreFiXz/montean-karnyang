/*
  Warnings:

  - You are about to drop the column `plateNumber` on the `LicensePlate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[plate,province]` on the table `LicensePlate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `plate` to the `LicensePlate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `LicensePlate_plateNumber_province_key` ON `LicensePlate`;

-- AlterTable
ALTER TABLE `LicensePlate` DROP COLUMN `plateNumber`,
    ADD COLUMN `plate` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empId` VARCHAR(191) NOT NULL,
    `empName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `scanTime` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attendance_empId_idx`(`empId`),
    INDEX `Attendance_scanTime_idx`(`scanTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `LicensePlate_plate_province_key` ON `LicensePlate`(`plate`, `province`);
