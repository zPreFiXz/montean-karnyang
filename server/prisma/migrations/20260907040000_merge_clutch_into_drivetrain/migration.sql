-- คลัชกับเกียร์เป็นส่วนหนึ่งของระบบส่งกำลังอยู่แล้ว มีสองหมวดคู่กันทำให้ลังเลว่าของชิ้นไหนไปไหน
-- ย้ายของที่ค้างอยู่ (ถ้ามี) ไปหมวดระบบส่งกำลังก่อนแล้วค่อยลบหมวดเดิม
UPDATE `Part` p
JOIN `Category` old ON old.id = p.categoryId AND old.name = 'คลัช-เกียร์'
JOIN `Category` new_c ON new_c.name = 'ระบบส่งกำลัง'
SET p.categoryId = new_c.id;

UPDATE `Service` s
JOIN `Category` old ON old.id = s.categoryId AND old.name = 'คลัช-เกียร์'
JOIN `Category` new_c ON new_c.name = 'ระบบส่งกำลัง'
SET s.categoryId = new_c.id;

DELETE FROM `Category` WHERE `name` = 'คลัช-เกียร์';

-- รับช่วงตำแหน่งเดิมของคลัช-เกียร์ในแถบหมวดหมู่
UPDATE `Category` SET `sortOrder` = 80 WHERE `name` = 'ระบบส่งกำลัง';
