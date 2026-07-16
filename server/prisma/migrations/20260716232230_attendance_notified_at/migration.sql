-- เพิ่ม notifiedAt: null = แจ้งเตือน Telegram ยังไม่สำเร็จ (worker จะ retry)
ALTER TABLE `Attendance` ADD COLUMN `notifiedAt` DATETIME(3) NULL;
-- แถวเก่าถือว่าแจ้งไปแล้ว กันแจ้งซ้ำย้อนหลังตอน deploy
UPDATE `Attendance` SET `notifiedAt` = `createdAt`;
