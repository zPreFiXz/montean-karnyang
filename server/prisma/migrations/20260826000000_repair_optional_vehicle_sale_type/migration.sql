-- ขายอะไหล่หน้าร้าน: ลูกค้าไม่ได้เอารถมา บิลจึงไม่มีรถผูกอยู่
ALTER TABLE `repair` MODIFY COLUMN `vehicleId` INT NULL;

-- เพิ่มประเภทบิล SALE เพื่อแยกยอดขายปลีกออกจากงานซ่อมในรายงาน
ALTER TABLE `repair` MODIFY COLUMN `type` ENUM('GENERAL', 'SUSPENSION', 'SALE') NOT NULL DEFAULT 'GENERAL';
