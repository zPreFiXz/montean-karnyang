-- เงินสดกับสแกนจ่ายรวมเป็น "เงินสด/โอน" (CASH) บิลเก่าที่สแกนจ่ายย้ายมารวมด้วย
UPDATE `Repair` SET `paymentMethod` = 'CASH' WHERE `paymentMethod` = 'QR_CODE';

ALTER TABLE `Repair`
  MODIFY `paymentMethod` ENUM('CASH', 'CREDIT_CARD', 'CHEQUE') NULL;
