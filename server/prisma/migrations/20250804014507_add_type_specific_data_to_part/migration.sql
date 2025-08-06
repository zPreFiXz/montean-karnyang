/*
  Warnings:

  - Made the column `partNumber` on table `Part` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Part` ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `lotNumber` VARCHAR(191) NULL,
    ADD COLUMN `typeSpecificData` JSON NULL,
    MODIFY `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    MODIFY `minStockLevel` INTEGER NOT NULL DEFAULT 0,
    MODIFY `partNumber` VARCHAR(191) NOT NULL;
