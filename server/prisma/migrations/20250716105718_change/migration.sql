/*
  Warnings:

  - You are about to alter the column `role` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `employees` MODIFY `role` ENUM('employee', 'admin') NOT NULL DEFAULT 'employee';
