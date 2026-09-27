-- เลขเอกสารแยกตามประเภท เรียงต่อกันในแต่ละเดือน เช่น RE-6909-0001
ALTER TABLE `Repair`
  ADD COLUMN `receiptNo` VARCHAR(20) NULL,
  ADD COLUMN `deliveryNo` VARCHAR(20) NULL,
  ADD COLUMN `quotationNo` VARCHAR(20) NULL;

CREATE UNIQUE INDEX `Repair_receiptNo_key` ON `Repair`(`receiptNo`);
CREATE UNIQUE INDEX `Repair_deliveryNo_key` ON `Repair`(`deliveryNo`);
CREATE UNIQUE INDEX `Repair_quotationNo_key` ON `Repair`(`quotationNo`);

CREATE TABLE `DocumentCounter` (
  `prefix` VARCHAR(4) NOT NULL,
  `period` VARCHAR(4) NOT NULL,
  `lastNo` INTEGER NOT NULL,
  PRIMARY KEY (`prefix`, `period`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BillingNote` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `number` VARCHAR(20) NOT NULL,
  `customerId` INTEGER NOT NULL,
  `repairKey` CHAR(40) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `BillingNote_number_key`(`number`),
  UNIQUE INDEX `BillingNote_customerId_repairKey_key`(`customerId`, `repairKey`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BillingNote` ADD CONSTRAINT `BillingNote_customerId_fkey`
  FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ใส่เลขให้บิลเก่าตามสถานะปัจจุบัน เรียงตามวันที่ภายในเดือน
-- เวลาในฐานข้อมูลเป็น UTC บวก 7 ชั่วโมงให้เป็นเวลาไทย บิลช่วงเที่ยงคืนจะได้เข้าเดือนถูก
-- วันที่ที่ใช้ตรงกับวันที่บนหัวใบ: ใบเสร็จใช้วันรับเงิน ใบส่งของกับใบเสนอราคาใช้วันเปิดบิล
CREATE TEMPORARY TABLE `_doc_backfill` AS
SELECT
  `id`,
  `prefix`,
  `period`,
  ROW_NUMBER() OVER (PARTITION BY `prefix`, `period` ORDER BY `issuedAt`, `id`) AS `seq`
FROM (
  SELECT
    `id`,
    CASE `status` WHEN 'PAID' THEN 'RE' WHEN 'CREDIT' THEN 'DO' ELSE 'QT' END AS `prefix`,
    DATE_ADD(IF(`status` = 'PAID', COALESCE(`paidAt`, `createdAt`), `createdAt`), INTERVAL 7 HOUR) AS `issuedAt`,
    CONCAT(
      LPAD(MOD(YEAR(DATE_ADD(IF(`status` = 'PAID', COALESCE(`paidAt`, `createdAt`), `createdAt`), INTERVAL 7 HOUR)) + 543, 100), 2, '0'),
      DATE_FORMAT(DATE_ADD(IF(`status` = 'PAID', COALESCE(`paidAt`, `createdAt`), `createdAt`), INTERVAL 7 HOUR), '%m')
    ) AS `period`
  FROM `Repair`
  WHERE `status` IN ('PAID', 'CREDIT', 'ESTIMATE')
) AS `issued`;

UPDATE `Repair` r
JOIN `_doc_backfill` b ON b.`id` = r.`id`
SET
  r.`receiptNo` = IF(b.`prefix` = 'RE', CONCAT('RE-', b.`period`, '-', LPAD(b.`seq`, 4, '0')), r.`receiptNo`),
  r.`deliveryNo` = IF(b.`prefix` = 'DO', CONCAT('DO-', b.`period`, '-', LPAD(b.`seq`, 4, '0')), r.`deliveryNo`),
  r.`quotationNo` = IF(b.`prefix` = 'QT', CONCAT('QT-', b.`period`, '-', LPAD(b.`seq`, 4, '0')), r.`quotationNo`);

-- ตัวนับเริ่มต่อจากเลขสุดท้ายที่ใส่ย้อนหลังไป
INSERT INTO `DocumentCounter` (`prefix`, `period`, `lastNo`)
SELECT `prefix`, `period`, MAX(`seq`) FROM `_doc_backfill` GROUP BY `prefix`, `period`;

DROP TEMPORARY TABLE `_doc_backfill`;
