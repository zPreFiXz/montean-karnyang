-- เปลี่ยนชื่อคอลัมน์ typeSpecificData เป็น attributes (ชื่อที่เป็นมาตรฐานวงการกว่า)
ALTER TABLE `Part` RENAME COLUMN `typeSpecificData` TO `attributes`;
