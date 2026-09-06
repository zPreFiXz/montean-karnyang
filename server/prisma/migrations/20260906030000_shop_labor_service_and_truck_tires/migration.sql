-- บรรทัดค่าแรงตั้งต้นของบิลเช็กช่วงล่างอ้างถึงบริการนี้ด้วยชื่อ (ดู DEFAULT_LABOR_SERVICE_NAME ฝั่งหน้าเว็บ)
-- ชื่อในคลังจึงต้องตรงกัน ไม่งั้นเปิดบิลช่วงล่างแล้วจะไม่มีบรรทัดค่าแรงขึ้นมาให้
-- ชื่อบริการเป็น unique เช็กก่อนว่ายังไม่มีชื่อใหม่อยู่ จะได้รันซ้ำได้โดยไม่ชนกัน
UPDATE `Service` s
LEFT JOIN (SELECT id FROM `Service` WHERE name = 'ค่าแรง') existing ON 1 = 1
SET s.name = 'ค่าแรง'
WHERE s.name = 'บริการอื่นๆ' AND existing.id IS NULL;

-- ยางบรรทุกเขียนหน้ายางเป็นนิ้วและมีจุดทศนิยม (8.25-16) ของเดิมกรอกตกจุดไปเป็น 825
-- และเป็นยางผ้าใบซึ่งคั่นด้วยขีด ไม่ใช่ R ที่แปลว่าเรเดียล
UPDATE `Part`
SET `attributes` = JSON_SET(`attributes`, '$.width', '7.50', '$.construction', '-')
WHERE JSON_UNQUOTE(JSON_EXTRACT(`attributes`, '$.width')) = '750';

UPDATE `Part`
SET `attributes` = JSON_SET(`attributes`, '$.width', '8.25', '$.construction', '-')
WHERE JSON_UNQUOTE(JSON_EXTRACT(`attributes`, '$.width')) = '825';
