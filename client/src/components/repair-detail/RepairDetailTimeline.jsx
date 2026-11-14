import { formatDate, formatTime } from "@/utils/formats";
import { depositTermsOf } from "@/utils/receipt";

const Row = ({ label, at }) => (
  <div className="flex justify-between">
    <p className="text-subtle-dark text-lg font-medium md:text-xl">{label}</p>
    <p className="text-normal text-lg font-medium md:text-xl">
      {formatDate(at)} | {formatTime(at)} น.
    </p>
  </div>
);

// ใบประเมินยังไม่ได้เริ่มงาน เวลาที่สร้างจึงเป็นเวลาประเมิน
// พอเปลี่ยนเป็นกำลังซ่อม เซิร์ฟเวอร์ตั้ง createdAt ใหม่เป็นเวลาเริ่มจริง
const startLabel = (repair, isSale) => {
  if (repair.status === "ESTIMATE") return "เสนอราคา:";
  return isSale ? "ขาย:" : "เริ่มซ่อม:";
};

// บิลขายที่จ่ายตอนสร้าง (paidOnCreate) เกิดและจบพร้อมกัน มีแค่เวลาชำระเงิน
// เรียงตามเวลาจริง มัดจำรับตอนเป็นใบเสนอราคาได้ ซึ่งก่อนเวลาเริ่มซ่อม
const RepairDetailTimeline = ({ repair, isSale, paidOnCreate }) => {
  const terms = depositTermsOf(repair);
  const rows = [
    !paidOnCreate && {
      label: startLabel(repair, isSale),
      at: repair.createdAt,
    },
    !paidOnCreate &&
      !isSale && { label: "ซ่อมเสร็จสิ้น:", at: repair.completedAt },
    { label: paidOnCreate ? "วันเวลา:" : "ชำระเงิน:", at: repair.paidAt },
    { label: terms.timeline, at: repair.depositPaidAt },
    { label: "ยกเลิก:", at: repair.cancelledAt },
    // ยกเลิกโดยไม่คืนเงิน = ร้านริบมัดจำ ตอนยกเลิก บิลที่จ่ายแล้วหักมัดจำไปในยอดแล้ว
    repair.depositAmount &&
      repair.cancelledStatus !== "PAID" && {
        label: `${repair.depositRefundedAt ? terms.refund : terms.keep}:`,
        at: repair.depositRefundedAt || repair.cancelledAt,
      },
  ]
    .filter((row) => row && row.at)
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <div className="mb-4 px-5">
      <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
        {paidOnCreate ? "เวลาชำระเงิน" : "วันเวลา"}
      </p>
      <div className="space-y-2 rounded-lg bg-gray-50 p-4">
        {rows.map((row) => (
          <Row key={row.label} label={row.label} at={row.at} />
        ))}
      </div>
    </div>
  );
};

export default RepairDetailTimeline;
