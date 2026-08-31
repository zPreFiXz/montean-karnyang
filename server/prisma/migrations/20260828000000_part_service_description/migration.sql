-- บันทึกภายในของร้านสำหรับอะไหล่และบริการ (ยี่ห้อเทียบเท่า ที่มาของของ ข้อควรระวังตอนใส่)
ALTER TABLE `Part` ADD COLUMN `description` TEXT NULL AFTER `compatibleVehicles`;
ALTER TABLE `Service` ADD COLUMN `description` TEXT NULL AFTER `price`;
