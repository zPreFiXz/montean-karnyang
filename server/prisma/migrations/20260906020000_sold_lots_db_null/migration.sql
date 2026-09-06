-- รายการที่ไม่ใช่ยางไม่มีล็อตให้เก็บ แต่ของเดิมเก็บเป็นคำว่า null ในช่อง JSON แทนที่จะเว้นช่องว่างไว้
-- (Prisma แปลง null ธรรมดาเป็น JSON null ต้องสั่ง DbNull ถึงจะเว้นช่องจริง — โค้ดแก้แล้วในรอบเดียวกัน)
-- ปนกันสองแบบทำให้ต้องเช็กทั้ง IS NULL และ JSON_TYPE ทุกครั้งที่ค้นด้วย SQL
UPDATE `RepairItem` SET `soldLots` = NULL WHERE JSON_TYPE(`soldLots`) = 'NULL';
