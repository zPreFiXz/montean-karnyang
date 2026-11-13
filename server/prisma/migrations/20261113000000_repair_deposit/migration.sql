-- มัดจำของบิล รับก่อนซ่อมได้ครั้งเดียวต่อบิล ตอนชำระหักออกจากยอด
-- depositRefundedAt = ยกเลิกบิลแล้วคืนเงินมัดจำ ยกเลิกโดยไม่คืน = ร้านริบมัดจำ
ALTER TABLE `Repair`
  ADD COLUMN `depositAmount` INTEGER NULL AFTER `chequeDate`,
  ADD COLUMN `depositMethod` ENUM('CASH', 'CREDIT_CARD', 'CHEQUE') NULL AFTER `depositAmount`,
  ADD COLUMN `depositPaidAt` DATETIME(3) NULL AFTER `depositMethod`,
  ADD COLUMN `depositRefundedAt` DATETIME(3) NULL AFTER `depositPaidAt`;
