-- ลำดับบริการเดิมอยู่ในโค้ดหน้าเว็บ (SERVICE_ORDER) ย้ายมาเก็บในฐานข้อมูลให้ร้านจัดเรียงเองได้
ALTER TABLE `Service` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 999;

UPDATE `Service` SET `sortOrder` = CASE `name`
  WHEN 'อะไหล่อื่นๆ' THEN 1
  WHEN 'บริการอื่นๆ' THEN 2
  WHEN 'ค่าแรง' THEN 3
  WHEN 'ปะยาง' THEN 4
  WHEN 'ปะยาง (แผ่นใหญ่)' THEN 5
  WHEN 'ปะยาง (รถไถ)' THEN 6
  WHEN 'อัดกาวขอบแมกซ์' THEN 7
  WHEN 'อัดกาวขอบแม็กซ์ (มอเตอร์ไซค์)' THEN 8
  WHEN 'จุ๊บลม' THEN 9
  WHEN 'จาระบี' THEN 10
  WHEN 'เปลี่ยนจุ๊บลม' THEN 11
  WHEN 'ถ่วงล้อ' THEN 12
  WHEN 'สลับยาง+ถ่วงล้อ' THEN 13
  WHEN 'ตั้งศูนย์' THEN 14
  WHEN 'ตั้งศูนย์ 4 ล้อ' THEN 15
  WHEN 'ปะยางรถมอเตอร์ไซค์ (ไหมเสียบ)' THEN 16
  WHEN 'ปะยางรถมอเตอร์ไซค์ (สตรีมเย็น)' THEN 17
  WHEN 'ปะยางนอกรถหกล้อ' THEN 18
  WHEN 'ปะยางในรถหกล้อ (สตรีมร้อน)' THEN 19
  WHEN 'ปะยางในรถไถ ล้อหน้า (สตรีมเย็น)' THEN 20
  WHEN 'ถอด-ใส่ยาง' THEN 21
  WHEN 'ถอด-ใส่ยาง (มอเตอร์ไซค์)' THEN 22
  WHEN 'ถอด-ใส่ยาง (ร้านมอเตอร์ไซค์)' THEN 23
  WHEN 'เปลี่ยนยาง (มอเตอร์ไซค์)' THEN 24
  WHEN 'เป่ากรองอากาศ' THEN 25
  WHEN 'เช็กเดินทางไกล' THEN 26
  ELSE 999
END;
