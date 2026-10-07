-- ชุดน้ำมันเครื่องผูกกับตัวเก็บน้ำมันเกรดเดียวกัน (สต็อกเป็นลิตร) ขายชุดแล้วตัดน้ำมันตามลิตรของชุด
ALTER TABLE `Part`
  ADD COLUMN `oilSourceId` INTEGER NULL,
  ADD COLUMN `oilLiters` DECIMAL(6, 2) NULL;

ALTER TABLE `Part` ADD CONSTRAINT `Part_oilSourceId_fkey`
  FOREIGN KEY (`oilSourceId`) REFERENCES `Part`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
