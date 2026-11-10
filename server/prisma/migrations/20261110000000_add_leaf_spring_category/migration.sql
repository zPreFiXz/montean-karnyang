-- แหนบเป็นงานแยกจากช่วงล่าง เดิมพิมพ์ชื่อลงบิลเป็นอะไหล่อื่นๆ (ยางหูแหนบ สะดือแหนบ แหนบหู)
-- อยู่ต่อจากโช้คอัพ
INSERT IGNORE INTO `Category` (`name`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES ('แหนบ', 75, NOW(3), NOW(3));
