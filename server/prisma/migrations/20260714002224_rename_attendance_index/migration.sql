-- ปรับชื่อ index ให้ตรงกับชื่อคอลัมน์ใหม่ตามที่ Prisma คาดหวัง
ALTER TABLE `Attendance` RENAME INDEX `Attendance_employeeId_scanTime_idx` TO `Attendance_employeeId_scannedAt_idx`;
