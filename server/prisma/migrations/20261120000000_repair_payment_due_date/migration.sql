-- วันนัดชำระของบิลเครดิตและบิลที่รับชำระบางส่วน (ร้านตกลงกับลูกค้า) ไม่บังคับ
ALTER TABLE `Repair`
  ADD COLUMN `paymentDueDate` DATE NULL AFTER `depositRefundedAt`;
