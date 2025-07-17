/*
  Warnings:

  - You are about to drop the column `employee_id` on the `Repair` table. All the data in the column will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `Repair` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Repair` DROP FOREIGN KEY `Repair_employee_id_fkey`;

-- DropIndex
DROP INDEX `Repair_employee_id_fkey` ON `Repair`;

-- AlterTable
ALTER TABLE `Repair` DROP COLUMN `employee_id`,
    ADD COLUMN `user_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Employee`;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('EMPLOYEE', 'ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `date_of_birth` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
