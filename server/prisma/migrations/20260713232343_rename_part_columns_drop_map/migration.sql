-- เปลี่ยนชื่อคอลัมน์จริงให้ตรงกับชื่อ field ใน Prisma (ถอด @map ออก)
ALTER TABLE `Part` RENAME COLUMN `quantity` TO `stockQuantity`;
ALTER TABLE `Part` RENAME COLUMN `public_id` TO `publicId`;
ALTER TABLE `Part` RENAME COLUMN `secure_url` TO `secureUrl`;
