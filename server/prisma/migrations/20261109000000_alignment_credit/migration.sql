-- สิทธิ์ตั้งศูนย์ฟรีที่ค้างไว้ (เปลี่ยนยางสี่เส้นแต่ช่วงล่างยังหลวม) กับบรรทัดที่มาใช้สิทธิ์ในบิลถัดไป
ALTER TABLE `RepairItem`
  ADD COLUMN `alignmentDeferred` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `alignmentFromRepairId` INTEGER NULL;

CREATE INDEX `RepairItem_alignmentFromRepairId_fkey` ON `RepairItem`(`alignmentFromRepairId`);

ALTER TABLE `RepairItem` ADD CONSTRAINT `RepairItem_alignmentFromRepairId_fkey` FOREIGN KEY (`alignmentFromRepairId`) REFERENCES `Repair`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
