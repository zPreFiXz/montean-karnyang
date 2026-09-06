-- อะไหล่บางอย่างไม่มียี่ห้อ (ของทำเอง ของโหล เช่น แผ่นปะยางนอก)
ALTER TABLE `Part` MODIFY `brand` VARCHAR(191) NULL;

-- ไม่มียี่ห้อต้องเก็บแบบเดียว ไม่งั้นจะมีทั้งค่าว่างและ NULL ปนกันจนต้องเช็กสองแบบทุกที่
UPDATE `Part` SET `brand` = NULL WHERE `brand` = '';
