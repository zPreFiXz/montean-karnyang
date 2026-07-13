-- เปลี่ยนค่า enum side เป็นตัวพิมพ์ใหญ่ตาม convention (ตาราง RepairItem ยังไม่มีข้อมูล)
ALTER TABLE `RepairItem` MODIFY `side` ENUM('LEFT', 'RIGHT', 'OTHER') NULL;
