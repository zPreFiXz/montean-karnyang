-- ยกเลิกบิลแทนการลบ เลขเอกสารจะได้ไม่ขาดช่วง บิลที่ยกเลิกยังอยู่พร้อมเลขเดิม
-- cancelledStatus จำว่าก่อนยกเลิกเป็นใบอะไร ใบพิมพ์จะได้ขึ้นชื่อใบเดิมพร้อมคำว่ายกเลิก
ALTER TABLE `Repair`
  MODIFY `status` ENUM('ESTIMATE', 'IN_PROGRESS', 'COMPLETED', 'CREDIT', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  ADD COLUMN `cancelledAt` DATETIME(3) NULL,
  ADD COLUMN `cancelledStatus` ENUM('ESTIMATE', 'IN_PROGRESS', 'COMPLETED', 'CREDIT', 'PAID', 'CANCELLED') NULL,
  ADD COLUMN `cancelReason` VARCHAR(200) NULL;

-- เลขที่ขาดไปเพราะเคยลบบิลกลางๆ ก่อนมีระบบยกเลิก ใส่บิลยกเลิกแทนให้ครบทุกเลข
-- ไล่จากตัวนับของแต่ละชุด (เลข 1 ถึงเลขล่าสุดที่ออกไป) แล้วเติมเฉพาะเลขที่ไม่มีบิลถืออยู่
-- วันที่ใช้วันของบิลที่ได้เลขก่อนหน้า ไม่มีก็ใช้ต้นเดือนของชุดนั้น (เวลาไทย = UTC + 7)
INSERT INTO `Repair` (
  `totalPrice`, `type`, `status`, `cancelledStatus`, `cancelledAt`, `cancelReason`,
  `receiptNo`, `deliveryNo`, `quotationNo`, `createdAt`, `updatedAt`, `userId`
)
WITH RECURSIVE `seqs` (`prefix`, `period`, `seq`, `lastNo`) AS (
  SELECT `prefix`, `period`, 1, `lastNo`
  FROM `DocumentCounter`
  WHERE `prefix` IN ('RE', 'DO', 'QT') AND `lastNo` > 0
  UNION ALL
  SELECT `prefix`, `period`, `seq` + 1, `lastNo` FROM `seqs` WHERE `seq` < `lastNo`
),
`gaps` AS (
  SELECT s.`prefix`, s.`period`, CONCAT(s.`prefix`, '-', s.`period`, '-', LPAD(s.`seq`, 4, '0')) AS `docNo`
  FROM `seqs` s
  WHERE NOT EXISTS (
    SELECT 1 FROM `Repair` r
    WHERE r.`receiptNo` = CONCAT(s.`prefix`, '-', s.`period`, '-', LPAD(s.`seq`, 4, '0'))
       OR r.`deliveryNo` = CONCAT(s.`prefix`, '-', s.`period`, '-', LPAD(s.`seq`, 4, '0'))
       OR r.`quotationNo` = CONCAT(s.`prefix`, '-', s.`period`, '-', LPAD(s.`seq`, 4, '0'))
  )
)
SELECT
  0,
  'GENERAL',
  'CANCELLED',
  CASE g.`prefix` WHEN 'RE' THEN 'PAID' WHEN 'DO' THEN 'CREDIT' ELSE 'ESTIMATE' END,
  NOW(3),
  'ถูกลบก่อนมีระบบยกเลิกบิล',
  IF(g.`prefix` = 'RE', g.`docNo`, NULL),
  IF(g.`prefix` = 'DO', g.`docNo`, NULL),
  IF(g.`prefix` = 'QT', g.`docNo`, NULL),
  COALESCE(
    (
      SELECT MAX(r.`createdAt`) FROM `Repair` r
      WHERE (g.`prefix` = 'RE' AND r.`receiptNo` LIKE CONCAT('RE-', g.`period`, '-%') AND r.`receiptNo` < g.`docNo`)
         OR (g.`prefix` = 'DO' AND r.`deliveryNo` LIKE CONCAT('DO-', g.`period`, '-%') AND r.`deliveryNo` < g.`docNo`)
         OR (g.`prefix` = 'QT' AND r.`quotationNo` LIKE CONCAT('QT-', g.`period`, '-%') AND r.`quotationNo` < g.`docNo`)
    ),
    DATE_SUB(
      STR_TO_DATE(CONCAT(2500 + CAST(LEFT(g.`period`, 2) AS UNSIGNED) - 543, '-', RIGHT(g.`period`, 2), '-01'), '%Y-%m-%d'),
      INTERVAL 7 HOUR
    )
  ),
  NOW(3),
  (SELECT MIN(`id`) FROM `User`)
FROM `gaps` g;
