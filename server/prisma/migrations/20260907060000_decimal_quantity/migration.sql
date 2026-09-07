-- น้ำมันขายเป็นลิตร ครึ่งลิตรก็ขายได้ จำนวนในบิลกับสต็อกจึงต้องรับทศนิยม
-- ของอย่างอื่นยังกรอกเป็นจำนวนเต็มเหมือนเดิม ตัวเลขที่ลงท้าย .00 แสดงผลเป็นจำนวนเต็ม
ALTER TABLE `RepairItem` MODIFY `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1;
ALTER TABLE `Part` MODIFY `stockQuantity` DECIMAL(10, 2) NOT NULL;
