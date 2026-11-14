-- เทิร์นยางเก่าหักจากยอดแบบเดียวกับส่วนลด เดิมใช้ส่วนลดแล้วพิมพ์ชื่อทับ ชื่อในบิลจึงไม่ตรงกัน
INSERT IGNORE INTO `Service` (`name`, `price`, `perSide`, `categoryId`, `createdAt`, `updatedAt`)
SELECT 'เทิร์นยางเก่า', 0, false, `id`, NOW(3), NOW(3)
FROM `Category`
WHERE `name` = 'บริการ';
