/*
  Warnings:

  - You are about to drop the column `imgUrl` on the `Part` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(0))`.
  - Added the required column `unit` to the `Part` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Part` DROP COLUMN `imgUrl`,
    ADD COLUMN `publicId` VARCHAR(191) NULL,
    ADD COLUMN `secureUrl` VARCHAR(191) NULL,
    ADD COLUMN `unit` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('EMPLOYEE', 'ADMIN') NOT NULL DEFAULT 'EMPLOYEE';
