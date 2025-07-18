-- DropForeignKey
ALTER TABLE `LicensePlate` DROP FOREIGN KEY `LicensePlate_vehicle_id_fkey`;

-- DropForeignKey
ALTER TABLE `Part` DROP FOREIGN KEY `Part_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `Repair` DROP FOREIGN KEY `Repair_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Repair` DROP FOREIGN KEY `Repair_vehicle_id_fkey`;

-- DropForeignKey
ALTER TABLE `RepairPart` DROP FOREIGN KEY `RepairPart_part_id_fkey`;

-- DropForeignKey
ALTER TABLE `RepairPart` DROP FOREIGN KEY `RepairPart_repair_id_fkey`;

-- DropForeignKey
ALTER TABLE `RepairService` DROP FOREIGN KEY `RepairService_repair_id_fkey`;

-- DropForeignKey
ALTER TABLE `RepairService` DROP FOREIGN KEY `RepairService_service_id_fkey`;

-- DropForeignKey
ALTER TABLE `Vehicle` DROP FOREIGN KEY `Vehicle_customer_id_fkey`;

-- DropIndex
DROP INDEX `LicensePlate_vehicle_id_fkey` ON `LicensePlate`;

-- DropIndex
DROP INDEX `Part_category_id_fkey` ON `Part`;

-- DropIndex
DROP INDEX `Repair_user_id_fkey` ON `Repair`;

-- DropIndex
DROP INDEX `Repair_vehicle_id_fkey` ON `Repair`;

-- DropIndex
DROP INDEX `RepairPart_part_id_fkey` ON `RepairPart`;

-- DropIndex
DROP INDEX `RepairPart_repair_id_fkey` ON `RepairPart`;

-- DropIndex
DROP INDEX `RepairService_repair_id_fkey` ON `RepairService`;

-- DropIndex
DROP INDEX `RepairService_service_id_fkey` ON `RepairService`;

-- DropIndex
DROP INDEX `Vehicle_customer_id_fkey` ON `Vehicle`;

-- AddForeignKey
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LicensePlate` ADD CONSTRAINT `LicensePlate_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepairPart` ADD CONSTRAINT `RepairPart_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `Repair`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepairPart` ADD CONSTRAINT `RepairPart_part_id_fkey` FOREIGN KEY (`part_id`) REFERENCES `Part`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepairService` ADD CONSTRAINT `RepairService_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `Repair`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepairService` ADD CONSTRAINT `RepairService_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
