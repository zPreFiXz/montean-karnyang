-- ใบเสร็จออกเลขตั้งแต่เปิดบิล (ร้านพิมพ์ใบเสร็จไปยื่นก่อนเก็บเงิน)
-- บิลที่กำลังซ่อมหรือซ่อมเสร็จรอเก็บเงินอยู่ ได้เลขต่อจากเลขสุดท้ายของเดือนที่เปิดบิล
CREATE TEMPORARY TABLE `_open_backfill` AS
SELECT
  x.`id`,
  x.`period`,
  COALESCE(c.`lastNo`, 0) + ROW_NUMBER() OVER (PARTITION BY x.`period` ORDER BY x.`issuedAt`, x.`id`) AS `seq`
FROM (
  SELECT
    `id`,
    DATE_ADD(`createdAt`, INTERVAL 7 HOUR) AS `issuedAt`,
    CONCAT(
      LPAD(MOD(YEAR(DATE_ADD(`createdAt`, INTERVAL 7 HOUR)) + 543, 100), 2, '0'),
      DATE_FORMAT(DATE_ADD(`createdAt`, INTERVAL 7 HOUR), '%m')
    ) AS `period`
  FROM `Repair`
  WHERE `status` IN ('IN_PROGRESS', 'COMPLETED') AND `receiptNo` IS NULL
) AS x
LEFT JOIN `DocumentCounter` c ON c.`prefix` = 'RE' AND c.`period` = x.`period`;

UPDATE `Repair` r
JOIN `_open_backfill` b ON b.`id` = r.`id`
SET r.`receiptNo` = CONCAT('RE-', b.`period`, '-', LPAD(b.`seq`, 4, '0'));

INSERT INTO `DocumentCounter` (`prefix`, `period`, `lastNo`)
SELECT 'RE', `period`, MAX(`seq`) FROM `_open_backfill` GROUP BY `period`
ON DUPLICATE KEY UPDATE `lastNo` = GREATEST(`DocumentCounter`.`lastNo`, VALUES(`lastNo`));

DROP TEMPORARY TABLE `_open_backfill`;
