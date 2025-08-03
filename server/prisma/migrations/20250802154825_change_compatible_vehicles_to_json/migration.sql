/*
  Warnings:

  - You are about to alter the column `compatibleVehicles` on the `Part` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `Part` MODIFY `compatibleVehicles` JSON NULL;
