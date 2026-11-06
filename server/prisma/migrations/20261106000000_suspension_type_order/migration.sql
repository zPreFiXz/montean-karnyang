-- ลำดับหัวข้อในหน้าเช็กช่วงล่าง ย้ายจากที่เขียนไว้ในโค้ดมาเก็บในฐานข้อมูล ให้ร้านจัดเรียงเองได้
CREATE TABLE `SuspensionTypeOrder` (
  `group` VARCHAR(10) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `sortOrder` INTEGER NOT NULL,
  PRIMARY KEY (`group`, `type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ลำดับเดิมที่ช่างไล่ตรวจจริง
INSERT INTO `SuspensionTypeOrder` (`group`, `type`, `sortOrder`) VALUES
  ('side', 'ลูกหมากปีกนกบน', 1),
  ('side', 'สลักปีกนกบน', 2),
  ('side', 'ลูกหมากปีกนกล่าง', 3),
  ('side', 'ลูกหมากแร็ค', 4),
  ('side', 'ยางกันฝุ่นแร็ค', 5),
  ('side', 'คันชักนอก', 6),
  ('side', 'คันชักนอก-ใน', 7),
  ('side', 'บูชปีกนกบน', 8),
  ('side', 'บูชปีกนกล่าง', 9),
  ('side', 'บูชปีกนกล่าง(เล็ก)', 10),
  ('side', 'บูชปีกนกล่าง(ใหญ่)', 11),
  ('side', 'สลักปีกนกล่าง', 12),
  ('side', 'ลูกหมากกันโคลงหน้า', 13),
  ('side', 'สกรูกันโคลง', 14),
  ('side', 'ยางกันโคลง', 15),
  ('other', 'คันส่งกลาง', 1),
  ('other', 'โช้คหน้า', 2),
  ('other', 'โช้คหลัง', 3);
