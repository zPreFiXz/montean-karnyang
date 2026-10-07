-- หมวดสำหรับอะไหล่ที่ไม่เข้าหมวดไหน อยู่ท้ายสุดของแถบหมวดหมู่
INSERT IGNORE INTO `Category` (`name`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES ('อื่นๆ', 140, NOW(3), NOW(3));
