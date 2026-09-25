-- บริการที่ทำแยกซ้าย-ขวา ตอนหยิบลงบิลจะถามว่าฝั่งไหน เหมือนอะไหล่ที่ตั้งว่าแยกซ้าย-ขวา
ALTER TABLE `Service` ADD COLUMN `perSide` BOOLEAN NOT NULL DEFAULT false;

-- ตั้งลูกปืนล้อทำทีละข้างอยู่แล้ว (หน้าเช็กช่วงล่างก็ให้เลือกซ้าย/ขวา)
UPDATE `Service` SET `perSide` = true WHERE `name` = 'ตั้งลูกปืนล้อ';
