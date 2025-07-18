/*
  Warnings:

  - You are about to drop the column `license_plate` on the `Vehicle` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Vehicle_license_plate_key` ON `Vehicle`;

-- AlterTable
ALTER TABLE `Vehicle` DROP COLUMN `license_plate`;

-- CreateTable
CREATE TABLE `LicensePlate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plate_number` VARCHAR(191) NOT NULL,
    `province` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `vehicle_id` INTEGER NOT NULL,

    UNIQUE INDEX `LicensePlate_plate_number_province_key`(`plate_number`, `province`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LicensePlate` ADD CONSTRAINT `LicensePlate_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
