// เงินที่ร้านรับจริงแต่ละครั้ง รายงานยอดขายนับตามวันรับเงิน
// มัดจำนับวันที่รับ ตอนชำระนับแค่ส่วนที่เหลือ ยกเลิกแล้วคืนมัดจำนับติดลบวันที่คืน ริบมัดจำก็ยังนับวันที่รับไว้
export const salesEntriesOf = (repairs, isInRange) => {
  const entries = [];
  for (const repair of repairs) {
    const deposit = Number(repair.depositAmount || 0);
    const total = Number(repair.totalPrice || 0);

    if (repair.status === "PAID" && repair.paidAt && isInRange(repair.paidAt)) {
      entries.push({
        key: `paid-${repair.id}`,
        repair,
        kind: "paid",
        at: repair.paidAt,
        amount: total - deposit,
        // บิลเก่าที่ไม่มีวิธีชำระเงินถือเป็นเงินสด ตรงกับค่าเริ่มต้นของฐานข้อมูล
        method: repair.paymentMethod || "CASH",
      });
    }
    if (deposit && repair.depositPaidAt && isInRange(repair.depositPaidAt)) {
      entries.push({
        key: `deposit-${repair.id}`,
        repair,
        kind: "deposit",
        at: repair.depositPaidAt,
        amount: deposit,
        method: repair.depositMethod || "CASH",
      });
    }
    if (
      deposit &&
      repair.depositRefundedAt &&
      isInRange(repair.depositRefundedAt)
    ) {
      entries.push({
        key: `refund-${repair.id}`,
        repair,
        kind: "refund",
        at: repair.depositRefundedAt,
        amount: -deposit,
        method: repair.depositMethod || "CASH",
      });
    }
  }
  return entries.sort((a, b) => new Date(b.at) - new Date(a.at));
};

export const ENTRY_NOTES = { deposit: "รับมัดจำ", refund: "คืนมัดจำ" };
