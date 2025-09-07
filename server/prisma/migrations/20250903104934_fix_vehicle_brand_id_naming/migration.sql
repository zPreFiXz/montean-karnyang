/*
  Warnings:

  - You are about to drop the `vehicle_brands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_models` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `vehicle_models` DROP FOREIGN KEY `vehicle_models_brandId_fkey`;

-- DropTable
DROP TABLE `vehicle_brands`;

-- DropTable
DROP TABLE `vehicle_models`;

-- CreateTable
CREATE TABLE `VehicleBrand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `VehicleBrand_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleModel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `vehicleBrandId` INTEGER NOT NULL,

    UNIQUE INDEX `VehicleModel_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VehicleModel` ADD CONSTRAINT `VehicleModel_vehicleBrandId_fkey` FOREIGN KEY (`vehicleBrandId`) REFERENCES `VehicleBrand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
