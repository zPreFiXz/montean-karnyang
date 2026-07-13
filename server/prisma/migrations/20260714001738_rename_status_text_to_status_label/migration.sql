-- เปลี่ยนชื่อคอลัมน์ statusText เป็น statusLabel (สื่อว่าเป็นป้ายข้อความสำหรับแสดงผล)
ALTER TABLE `Attendance` RENAME COLUMN `statusText` TO `statusLabel`;
