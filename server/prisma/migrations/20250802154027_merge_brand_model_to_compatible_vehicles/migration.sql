/*
  Warnings:

  - You are about to drop the column `compatibleBrands` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `compatibleModels` on the `Part` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Part` DROP COLUMN `compatibleBrands`,
    DROP COLUMN `compatibleModels`,
    ADD COLUMN `compatibleVehicles` VARCHAR(191) NULL;
