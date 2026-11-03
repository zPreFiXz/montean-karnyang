-- วันที่บนเช็ค พิมพ์ลงช่อง "ลงวันที่" ของใบเสร็จ
ALTER TABLE `Repair`
  ADD COLUMN `chequeDate` DATE NULL AFTER `chequeNo`;
