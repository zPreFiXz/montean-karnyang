-- RepairItem.dotCode ไม่ได้เก็บรหัส DOT ตัวเดียวเหมือน TireLot.dotCode
-- แต่เก็บสรุปล็อตที่ตัดออกไปพร้อมจำนวน เช่น "0126×2, 0226×1" — ชื่อเดิมจึงชวนสับสน
ALTER TABLE `repairitem` CHANGE COLUMN `dotCode` `soldLots` VARCHAR(191) NULL;
