import { describe, expect, it } from "vitest";
import { salesEntriesOf } from "@/utils/salesEntries";

const day = (d) => `2026-11-${String(d).padStart(2, "0")}T03:00:00.000Z`;
const onDay = (d) => (at) => at.slice(0, 10) === day(d).slice(0, 10);
const sum = (entries) => entries.reduce((t, e) => t + e.amount, 0);

describe("ยอดขายนับตามวันรับเงิน", () => {
  const deposited = {
    id: 1,
    status: "PAID",
    totalPrice: 5000,
    paidAt: day(20),
    paymentMethod: "CREDIT_CARD",
    depositAmount: 1500,
    depositMethod: "CASH",
    depositPaidAt: day(13),
  };

  it("มัดจำนับวันที่รับ ตอนจ่ายนับแค่ส่วนที่เหลือ", () => {
    expect(sum(salesEntriesOf([deposited], onDay(13)))).toBe(1500);
    expect(sum(salesEntriesOf([deposited], onDay(20)))).toBe(3500);
    expect(salesEntriesOf([deposited], onDay(20))[0].method).toBe(
      "CREDIT_CARD",
    );
  });

  it("ยกเลิกแล้วคืนมัดจำ ติดลบวันที่คืน", () => {
    const refunded = {
      ...deposited,
      status: "CANCELLED",
      paidAt: null,
      depositRefundedAt: day(15),
    };
    expect(sum(salesEntriesOf([refunded], onDay(13)))).toBe(1500);
    expect(sum(salesEntriesOf([refunded], onDay(15)))).toBe(-1500);
  });

  it("ริบมัดจำ ยังนับวันที่รับ", () => {
    const kept = { ...deposited, status: "CANCELLED", paidAt: null };
    expect(sum(salesEntriesOf([kept], onDay(13)))).toBe(1500);
    expect(sum(salesEntriesOf([kept], () => true))).toBe(1500);
  });

  it("บิลไม่มีมัดจำ นับเต็มยอดเหมือนเดิม", () => {
    const plain = { id: 2, status: "PAID", totalPrice: 900, paidAt: day(20) };
    expect(sum(salesEntriesOf([plain], onDay(20)))).toBe(900);
  });
});
