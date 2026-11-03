-- เรียงคอลัมน์ให้ตรงกับ schema.prisma (ข้อมูลของตัวเอง → เวลา → คีย์ความสัมพันธ์) ตอนเปิดดูใน DBeaver
-- คอลัมน์ที่ migration เก่าเพิ่มทีหลังไปต่อท้ายตาราง จึงย้ายกลับ นิยามคอลัมน์คงเดิมทุกตัว เปลี่ยนแค่ตำแหน่ง

ALTER TABLE `BillingNote`
  MODIFY `customerId` int NOT NULL AFTER `createdAt`;

ALTER TABLE `Category`
  MODIFY `sortOrder` int NOT NULL DEFAULT '999' AFTER `name`;

ALTER TABLE `Customer`
  MODIFY `taxId` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `address`;

ALTER TABLE `Part`
  MODIFY `oilLiters` decimal(6,2) DEFAULT NULL AFTER `secureUrl`;

ALTER TABLE `Repair`
  MODIFY `chequeBank` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `paidAt`,
  MODIFY `chequeNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `chequeBank`,
  MODIFY `cancelledAt` datetime(3) DEFAULT NULL AFTER `chequeNo`,
  MODIFY `cancelledStatus` enum('ESTIMATE','IN_PROGRESS','COMPLETED','CREDIT','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `cancelledAt`,
  MODIFY `cancelReason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `cancelledStatus`,
  MODIFY `receiptNo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `cancelReason`,
  MODIFY `deliveryNo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `receiptNo`,
  MODIFY `quotationNo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `deliveryNo`;

ALTER TABLE `RepairItem`
  MODIFY `itemUnit` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `itemName`;

ALTER TABLE `Service`
  MODIFY `unit` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `price`,
  MODIFY `perSide` tinyint(1) NOT NULL DEFAULT '0' AFTER `unit`,
  MODIFY `publicId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `perSide`,
  MODIFY `secureUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `publicId`;

ALTER TABLE `Vehicle`
  MODIFY `fleetNo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `id`;
