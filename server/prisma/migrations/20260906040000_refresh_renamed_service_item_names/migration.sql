-- ชื่อรายการในบิลเก็บเป็น snapshot ตอนบันทึก บิลเก่าจึงยังเป็นชื่อก่อนจัดคลังใหม่
-- อัปเดตเฉพาะสองชื่อที่รู้แน่ว่าเป็นการเปลี่ยนชื่อของรายการเดิม (ผูกกับบริการตัวเดียวกัน)
--
-- ไม่แตะบรรทัดค่าแรงที่ช่างพิมพ์ชื่องานเอง (ชุดน้ำมันเครื่อง + กรอง (7L) ฯลฯ)
-- เพราะนั่นคือเนื้อหาของบิลใบนั้น ไม่ใช่ชื่อที่ล้าสมัย เขียนทับแล้วประวัติจะหายไปเลย
UPDATE `RepairItem` ri
JOIN `Service` s ON s.id = ri.serviceId
SET ri.itemName = s.name
WHERE ri.itemName = 'ปะยางรถยนต์' AND s.name = 'ปะยาง';

UPDATE `RepairItem` ri
JOIN `Service` s ON s.id = ri.serviceId
SET ri.itemName = s.name
WHERE ri.itemName = 'ปะยางแผ่นใหญ่' AND s.name = 'ปะยาง (แผ่นใหญ่)';
