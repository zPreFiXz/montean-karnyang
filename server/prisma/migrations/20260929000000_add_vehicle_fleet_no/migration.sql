-- เบอร์รถที่บริษัทเจ้าของรถตั้งไว้ (เช่น รถน้ำแข็ง No.12) ไม่บังคับกรอก
ALTER TABLE `Vehicle` ADD COLUMN `fleetNo` VARCHAR(20) NULL;
