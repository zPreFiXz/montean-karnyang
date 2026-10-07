-- น้ำมันขวดลิตรใช้ได้หลายงาน (น้ำมันเครื่อง เกียร์ เฟืองท้าย) ชื่อในคลังจึงเหลือแค่เกรด
-- งานที่ใช้เลือกตอนหยิบลงบิล ชื่อในบิลเป็น "ยี่ห้อ งาน เกรด" บิลเก่าเก็บชื่อไว้แล้ว ไม่เปลี่ยนตาม
-- "(1L) น้ำมันเครื่อง SUPER COMMONRAIL (15W40)" -> "SUPER COMMONRAIL (15W40)"
-- รวมชื่อที่ตัด "(1L)" ออกไปเองแล้ว เช่น "น้ำมันเครื่อง DIESEL300 (15W40)"
UPDATE `Part` p
JOIN `Category` c ON c.`id` = p.`categoryId`
SET p.`name` = TRIM(SUBSTRING(p.`name`, LOCATE('น้ำมันเครื่อง', p.`name`) + CHAR_LENGTH('น้ำมันเครื่อง')))
WHERE c.`name` = 'น้ำมัน'
  AND p.`unit` = 'ลิตร'
  AND p.`oilSourceId` IS NULL
  AND (p.`name` LIKE '(1L)%น้ำมันเครื่อง%' OR p.`name` LIKE 'น้ำมันเครื่อง%')
  AND p.`name` NOT LIKE '%ชุด%';
