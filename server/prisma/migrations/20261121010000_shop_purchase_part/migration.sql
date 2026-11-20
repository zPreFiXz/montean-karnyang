-- อะไหล่ที่รับจากร้านค้าเลือกจากสต็อก รับแล้วบวกเข้าสต็อก ลบรายการแล้วหักคืน
-- itemName/unit ยังเก็บไว้เป็นชื่อตอนรับ ลบอะไหล่ออกจากคลังทีหลังใบวางบิลยังอ่านได้
-- dotCode = สัปดาห์/ปีผลิตของยาง (เฉพาะยางที่นับตามล็อต)
ALTER TABLE `ShopPurchase`
  ADD COLUMN `partId` INTEGER NULL AFTER `customerId`,
  ADD COLUMN `dotCode` VARCHAR(4) NULL AFTER `unit`;

ALTER TABLE `ShopPurchase` ADD CONSTRAINT `ShopPurchase_partId_fkey`
  FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
