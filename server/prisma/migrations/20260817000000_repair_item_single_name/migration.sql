-- รวมชื่อรายการซ่อมสามคอลัมน์เป็นคอลัมน์เดียว
-- itemName เก็บข้อความที่แสดงทั้งบรรทัด (ยี่ห้อ + ไซซ์ + ชื่อ) ตอนบันทึกงานซ่อม
ALTER TABLE `repairitem` ADD COLUMN `itemName` VARCHAR(191) NULL;

-- ย้ายค่าเดิม: ของที่พิมพ์มือมาก่อน แล้วค่อยชื่ออะไหล่/บริการที่คัดลอกไว้
UPDATE `repairitem`
SET `itemName` = COALESCE(`customName`, `partName`, `serviceName`)
WHERE `itemName` IS NULL;

ALTER TABLE `repairitem` DROP COLUMN `partName`;
ALTER TABLE `repairitem` DROP COLUMN `serviceName`;
ALTER TABLE `repairitem` DROP COLUMN `customName`;
