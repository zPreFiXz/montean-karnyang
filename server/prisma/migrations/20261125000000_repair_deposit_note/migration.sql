-- ข้อความรายการบนใบรับเงินมัดจำที่แก้เอง ว่าง = ใช้ข้อความมาตรฐาน (เงินมัดจำค่าอะไหล่)
ALTER TABLE `Repair`
  ADD COLUMN `depositNote` VARCHAR(200) NULL AFTER `depositRefundedAt`;
