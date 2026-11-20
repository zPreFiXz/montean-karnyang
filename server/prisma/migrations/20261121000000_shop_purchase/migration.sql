-- อะไหล่ที่ร้านเราไปรับมาจากร้านค้า (ลูกค้าประเภทร้านค้า) ไว้หักกลบตอนวางบิล ไม่นับเข้าสต็อก
-- settledAt = หักกลบกับร้านเรียบร้อยแล้ว ไม่ขึ้นในใบวางบิลอีก
CREATE TABLE `ShopPurchase` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `customerId` INTEGER NOT NULL,
  `takenAt` DATE NOT NULL,
  `itemName` VARCHAR(200) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unit` VARCHAR(20) NULL,
  `unitPrice` INTEGER NOT NULL,
  `settledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ShopPurchase_customerId_settledAt_idx`(`customerId`, `settledAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ShopPurchase` ADD CONSTRAINT `ShopPurchase_customerId_fkey`
  FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
