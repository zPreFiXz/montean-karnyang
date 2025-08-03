-- AlterTable
ALTER TABLE `Part` ADD COLUMN `compatibleBrands` VARCHAR(191) NULL,
    ADD COLUMN `compatibleModels` VARCHAR(191) NULL,
    ADD COLUMN `yearRange` VARCHAR(191) NULL;
