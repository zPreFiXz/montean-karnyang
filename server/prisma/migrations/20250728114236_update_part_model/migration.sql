/*
  Warnings:

  - A unique constraint covering the columns `[partNumber]` on the table `Part` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `partNumber` to the `Part` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Part` ADD COLUMN `partNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Part_partNumber_key` ON `Part`(`partNumber`);
