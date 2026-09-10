-- เพิ่มสถานะใบประเมินราคา (ประเมินไว้แต่ยังไม่ซ่อม)
ALTER TABLE `Repair` MODIFY `status` ENUM('ESTIMATE', 'IN_PROGRESS', 'COMPLETED', 'CREDIT', 'PAID') NOT NULL DEFAULT 'IN_PROGRESS';
