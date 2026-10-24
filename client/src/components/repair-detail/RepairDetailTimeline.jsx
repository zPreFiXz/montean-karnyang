import { formatDate, formatTime } from "@/utils/formats";

const Row = ({ label, at }) => (
  <div className="flex justify-between">
    <p className="text-subtle-dark text-lg font-medium md:text-xl">{label}</p>
    <p className="text-normal text-lg font-medium md:text-xl">
      {formatDate(at)} | {formatTime(at)} น.
    </p>
  </div>
);

// บิลขายที่จ่ายตอนสร้าง (paidOnCreate) เกิดและจบพร้อมกัน มีแค่เวลาชำระเงิน
const RepairDetailTimeline = ({ repair, isSale, paidOnCreate }) => (
  <div className="mb-4 px-5">
    <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
      {paidOnCreate ? "เวลาชำระเงิน" : "เวลาดำเนินการ"}
    </p>
    <div className="space-y-2 rounded-lg bg-gray-50 p-4">
      {!paidOnCreate && (
        <>
          <Row label={isSale ? "ขาย:" : "เริ่มซ่อม:"} at={repair.createdAt} />
          {!isSale && repair.completedAt && (
            <Row label="ซ่อมเสร็จสิ้น:" at={repair.completedAt} />
          )}
        </>
      )}
      {repair.paidAt && (
        <Row
          label={paidOnCreate ? "วันเวลา:" : "ชำระเงิน:"}
          at={repair.paidAt}
        />
      )}
      {repair.cancelledAt && <Row label="ยกเลิก:" at={repair.cancelledAt} />}
      {repair.cancelReason && (
        <div className="flex justify-between gap-3">
          <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
            เหตุผล:
          </p>
          <p className="text-normal min-w-0 text-right text-lg font-medium break-words md:text-xl">
            {repair.cancelReason}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default RepairDetailTimeline;
