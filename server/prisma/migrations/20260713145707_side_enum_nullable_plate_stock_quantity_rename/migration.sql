/*
  Warnings:

  - You are about to alter the column `side` on the `RepairItem` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `RepairItem` MODIFY `side` ENUM('left', 'right', 'other') NULL;

-- AlterTable
ALTER TABLE `Vehicle` MODIFY `licensePlateId` INTEGER NULL;
