-- ลูกค้าที่เป็นหน่วยงานราชการหรือร้านค้า (ว่าง = ลูกค้าทั่วไป)
ALTER TABLE `Customer` ADD COLUMN `organizationType` ENUM('GOVERNMENT', 'SHOP') NULL;

-- ใช้กรองรายชื่อหน่วยงานและร้านค้าในหน้ารวม
CREATE INDEX `Customer_organizationType_idx` ON `Customer`(`organizationType`);
