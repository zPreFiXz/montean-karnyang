-- ยางเปอร์เซ็นต์เปลี่ยนชื่อในบิลเป็น "ยางเปอร์เซ็นต์ <เบอร์>" (ดู buildPartItemName)
-- แก้เฉพาะบรรทัดที่ระบบประกอบชื่อไว้เอง ("ยี่ห้อ เบอร์ รุ่น") บรรทัดที่พิมพ์ชื่อทับไว้ไม่แตะ
-- ขนาดยางประกอบแบบเดียวกับ formatTireSize: 215/70R15, ไม่มีแก้มยาง = 7R16, ผ้าใบคั่นด้วยขีด
UPDATE `RepairItem` ri
JOIN (
  SELECT
    p.id,
    NULLIF(TRIM(p.brand), '') AS brand,
    NULLIF(TRIM(p.name), '') AS name,
    CONCAT(
      TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.width'))),
      IF(
        COALESCE(TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.aspectRatio'))), '') IN ('', 'null'),
        '',
        CONCAT('/', TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.aspectRatio'))))
      ),
      IF(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.construction')) = '-', '-', 'R'),
      TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.rimDiameter')))
    ) AS size
  FROM `Part` p
  JOIN `Category` c ON c.id = p.categoryId
  WHERE c.name = 'ยางเปอร์เซ็นต์'
    AND COALESCE(TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.width'))), '') NOT IN ('', 'null')
    AND COALESCE(TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.attributes, '$.rimDiameter'))), '') NOT IN ('', 'null')
) t ON t.id = ri.partId
SET ri.itemName = CONCAT('ยางเปอร์เซ็นต์ ', t.size)
WHERE ri.itemName = CONCAT_WS(' ', t.brand, t.size, t.name);
