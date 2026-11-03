-- บิลเครดิตที่หน่วยงานมาจ่ายด้วยเช็ค เก็บธนาคารกับเลขที่เช็คไว้ตามหาทีหลัง
ALTER TABLE `Repair`
  MODIFY `paymentMethod` ENUM('CASH', 'QR_CODE', 'CREDIT_CARD', 'CHEQUE') NULL,
  ADD COLUMN `chequeBank` VARCHAR(100) NULL,
  ADD COLUMN `chequeNo` VARCHAR(50) NULL;
