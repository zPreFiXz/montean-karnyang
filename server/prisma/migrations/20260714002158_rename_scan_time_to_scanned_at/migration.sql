-- เปลี่ยนชื่อ scanTime เป็น scannedAt ให้เข้า convention timestamp ...At ของ schema
ALTER TABLE `Attendance` RENAME COLUMN `scanTime` TO `scannedAt`;
