-- เลขประจำตัวผู้เสียภาษีอากร 13 หลักของลูกค้า ใช้ออกใบเสร็จให้หน่วยงานและร้านค้า
ALTER TABLE `Customer` ADD COLUMN `taxId` VARCHAR(13) NULL;
