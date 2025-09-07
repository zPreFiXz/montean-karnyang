/*
  Warnings:

  - You are about to drop the `VehicleBrand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleModel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `VehicleModel` DROP FOREIGN KEY `VehicleModel_brandId_fkey`;

-- DropTable
DROP TABLE `VehicleBrand`;

-- DropTable
DROP TABLE `VehicleModel`;

-- CreateTable
CREATE TABLE `vehicle_brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `vehicle_brands_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_models` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `brandId` INTEGER NOT NULL,

    UNIQUE INDEX `vehicle_models_name_brandId_key`(`name`, `brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `vehicle_brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
