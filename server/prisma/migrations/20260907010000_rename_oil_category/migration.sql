-- หมวดนี้ไม่ได้มีแต่น้ำมันเครื่อง ยังมีน้ำมันเบรก เกียร์ พาวเวอร์ เฟืองท้าย
-- ชื่อกว้างกว่าเดิมจึงตรงกับของที่อยู่ในหมวดจริง
-- (ชื่อหมวดเป็น unique เช็กก่อนว่ายังไม่มีชื่อใหม่ จะได้รันซ้ำได้)
UPDATE `Category` c
LEFT JOIN (SELECT id FROM `Category` WHERE name = 'น้ำมัน') existing ON 1 = 1
SET c.name = 'น้ำมัน'
WHERE c.name = 'น้ำมันเครื่อง' AND existing.id IS NULL;
