-- ย้ายคอลัมน์ไปอยู่ต่อจาก name ให้ตรงกับ schema.prisma
-- (description เป็นข้อความบรรยายตัวของ จึงควรอยู่กลุ่มเดียวกับชื่อ ไม่ใช่ท้ายคอลัมน์ JSON)
-- ลำดับคอลัมน์ไม่มีผลกับการทำงาน แต่ช่วยตอนเปิดดูตารางด้วยเครื่องมือจัดการ DB
ALTER TABLE `Part` MODIFY COLUMN `description` TEXT NULL AFTER `name`;
ALTER TABLE `Service` MODIFY COLUMN `description` TEXT NULL AFTER `name`;
