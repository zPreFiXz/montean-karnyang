-- ตารางกันส่งข้อความประจำวันซ้ำ (ทน worker restart) และรองรับส่งย้อนหลังในวันเดียวกัน
CREATE TABLE `DailyNotice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateKey` VARCHAR(191) NOT NULL,
    `kind` ENUM('DAY_START', 'ALL_CLOCKED_IN', 'DAILY_SUMMARY') NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DailyNotice_dateKey_kind_key`(`dateKey`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
