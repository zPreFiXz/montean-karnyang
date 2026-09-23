-- หน่วยที่พิมพ์เองของบรรทัดอะไหล่อื่นๆ (ว่าง = ใช้หน่วยของอะไหล่ในคลัง)
ALTER TABLE `RepairItem` ADD COLUMN `itemUnit` VARCHAR(191) NULL;
