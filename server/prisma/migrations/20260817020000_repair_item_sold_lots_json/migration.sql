-- soldLots เดิมเก็บข้อความสำหรับแสดงผล "0126×3, 0626×1" ซึ่งการคืนสต็อกต้องแกะด้วย regex
-- เปลี่ยนเป็น JSON [{ dotCode, quantity }] เพื่อให้การแสดงผลเปลี่ยนได้โดยไม่กระทบการคืนล็อต
--
-- ถ้าฐานข้อมูลมีค่าแบบข้อความเดิมอยู่ ต้องรัน scripts/backfillSoldLotsJson.js --apply ก่อน
-- ไม่งั้น MySQL จะปฏิเสธการแปลงชนิด (Error 3140: Invalid JSON text)
ALTER TABLE `repairitem` MODIFY COLUMN `soldLots` JSON NULL;
