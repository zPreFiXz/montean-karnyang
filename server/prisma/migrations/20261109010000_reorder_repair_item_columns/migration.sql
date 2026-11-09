-- เรียงคอลัมน์ให้ตรงกับ schema.prisma (ข้อมูลของตัวเอง → เวลา → คีย์ความสัมพันธ์) ตอนเปิดดูใน DBeaver
-- alignmentDeferred เป็นข้อมูลของบรรทัด ย้ายไปไว้ก่อนเวลา นิยามคอลัมน์คงเดิม เปลี่ยนแค่ตำแหน่ง
ALTER TABLE `RepairItem`
  MODIFY `alignmentDeferred` tinyint(1) NOT NULL DEFAULT '0' AFTER `soldLots`;
