/*
  Warnings:

  - You are about to drop the `LicensePlate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[license_plate]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `license_plate` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `LicensePlate` DROP FOREIGN KEY `LicensePlate_vehicle_id_fkey`;

-- AlterTable
ALTER TABLE `Vehicle` ADD COLUMN `license_plate` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `LicensePlate`;

-- CreateIndex
CREATE UNIQUE INDEX `Vehicle_license_plate_key` ON `Vehicle`(`license_plate`);
