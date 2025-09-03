/*
  Warnings:

  - You are about to drop the column `brand` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the `VehicleBrand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleModel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `vehicleBrandModelId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `VehicleModel` DROP FOREIGN KEY `VehicleModel_vehicleBrandId_fkey`;

-- AlterTable
ALTER TABLE `Vehicle` DROP COLUMN `brand`,
    DROP COLUMN `model`,
    ADD COLUMN `vehicleBrandModelId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `VehicleBrand`;

-- DropTable
DROP TABLE `VehicleModel`;

-- CreateTable
CREATE TABLE `VehicleBrandModel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `VehicleBrandModel_brand_model_key`(`brand`, `model`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_vehicleBrandModelId_fkey` FOREIGN KEY (`vehicleBrandModelId`) REFERENCES `VehicleBrandModel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
