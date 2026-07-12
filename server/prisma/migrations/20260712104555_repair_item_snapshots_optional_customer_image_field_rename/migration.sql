-- AlterTable
ALTER TABLE `Repair` MODIFY `customerId` INTEGER NULL;

-- AlterTable
ALTER TABLE `RepairItem` ADD COLUMN `partName` VARCHAR(191) NULL,
    ADD COLUMN `serviceName` VARCHAR(191) NULL;
