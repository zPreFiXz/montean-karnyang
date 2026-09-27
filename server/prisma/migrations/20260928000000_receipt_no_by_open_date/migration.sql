-- ใบเสร็จลงวันที่เปิดบิลเสมอ พิมพ์ซ้ำกี่รอบวันที่ก็เหมือนใบแรกที่ยื่นให้ลูกค้า
-- เลขใบเสร็จจึงต้องนับเดือนและเรียงลำดับจากวันเปิดบิลด้วย เดือนในเลขจะได้ตรงกับวันที่บนหัวใบ
-- เรียงใหม่ทั้งชุดได้ เพราะ migration นี้รันพร้อมกับตอนที่ใส่เลขครั้งแรก ยังไม่มีใบไหนพิมพ์ด้วยเลขเหล่านี้
CREATE TEMPORARY TABLE `_receipt_renumber` AS
SELECT
  `id`,
  `period`,
  ROW_NUMBER() OVER (PARTITION BY `period` ORDER BY `issuedAt`, `id`) AS `seq`
FROM (
  SELECT
    `id`,
    DATE_ADD(`createdAt`, INTERVAL 7 HOUR) AS `issuedAt`,
    CONCAT(
      LPAD(MOD(YEAR(DATE_ADD(`createdAt`, INTERVAL 7 HOUR)) + 543, 100), 2, '0'),
      DATE_FORMAT(DATE_ADD(`createdAt`, INTERVAL 7 HOUR), '%m')
    ) AS `period`
  FROM `Repair`
  WHERE `receiptNo` IS NOT NULL
) AS x;

-- ล้างก่อนใส่ใหม่ ไม่งั้นเลขที่สลับที่กันจะชนดัชนีห้ามซ้ำระหว่างทาง
UPDATE `Repair` r
JOIN `_receipt_renumber` b ON b.`id` = r.`id`
SET r.`receiptNo` = NULL;

UPDATE `Repair` r
JOIN `_receipt_renumber` b ON b.`id` = r.`id`
SET r.`receiptNo` = CONCAT('RE-', b.`period`, '-', LPAD(b.`seq`, 4, '0'));

DELETE FROM `DocumentCounter` WHERE `prefix` = 'RE';

INSERT INTO `DocumentCounter` (`prefix`, `period`, `lastNo`)
SELECT 'RE', `period`, MAX(`seq`) FROM `_receipt_renumber` GROUP BY `period`;

DROP TEMPORARY TABLE `_receipt_renumber`;
