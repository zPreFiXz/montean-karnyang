-- ลำดับที่จัดเองในหน้าจัดการยี่ห้อและรุ่นรถ
-- AFTER `model` เพื่อให้ลำดับคอลัมน์ในตารางตรงกับใน schema.prisma เวลาเปิดดูด้วยเครื่องมือจัดการ DB
ALTER TABLE `vehiclemodel` ADD COLUMN `sortOrder` INT NOT NULL DEFAULT 0 AFTER `model`;

-- ข้อมูลเดิมเรียงตาม id อยู่แล้ว จึงเซ็ตให้ตรงกันก่อน ลำดับที่เห็นจะไม่เปลี่ยนหลัง migrate
UPDATE `vehiclemodel` SET `sortOrder` = `id`;
