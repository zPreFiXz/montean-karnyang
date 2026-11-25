-- อะไหล่ที่ไม่นับสต็อก ขายได้ไม่จำกัด ไม่ตัดไม่คืนสต็อก (ห้ามใช้กับยางที่นับล็อตและชุดน้ำมัน)
ALTER TABLE `Part`
  ADD COLUMN `unlimitedStock` BOOLEAN NOT NULL DEFAULT false AFTER `minStockLevel`;
