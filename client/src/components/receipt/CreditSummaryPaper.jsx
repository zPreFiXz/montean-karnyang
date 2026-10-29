import { PAYMENT_QR_NAME, SHOP, shortProvince } from "@/utils/receipt";
import { bahtText } from "@/utils/bahtText";
import { formatDateShort, formatPhone } from "@/utils/formats";
import { getDisplayBrand, getRepairTitle } from "@/utils/repairDisplay";

// ต้องตรงกับ buildOrganizationBillHtml ใน server/utils/receiptHtml.js
const money = (value) => Number(value || 0).toLocaleString("th-TH");

// repairs = บิลของแผ่นนี้ startIndex = ลำดับแรกของแผ่น total = ยอดรวมทุกแผ่น
// ยอดรวม ช่องเซ็น และ QR อยู่เฉพาะแผ่นสุดท้าย (ต้องตรงกับ buildOrganizationBillHtml)
const CreditSummaryPaper = ({
  customer,
  repairs,
  startIndex = 0,
  total,
  docNo,
  isLastPage = true,
}) => {
  const billedAt = new Date();

  return (
    <>
      <div className="flex-none">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <span />
          <div className="text-center">
            <p className="text-[15pt] font-semibold">ใบวางบิล</p>
            <p className="text-[17pt] font-semibold">{SHOP.name}</p>
          </div>
          <p className="flex items-end justify-end gap-1 whitespace-nowrap">
            เลขที่
            <span className="min-w-10.5 border-b border-dotted border-black text-center font-semibold">
              {docNo || ""}
            </span>
          </p>
        </div>

        <p className="mt-0.5 text-center">{SHOP.address}</p>
        <p className="text-center">{SHOP.contact}</p>

        {/* ต้องตรงกับ buildOrganizationBillHtml วันที่วางบิลคือวันที่พิมพ์ */}
        <div className="mt-2 flex justify-end gap-3">
          <p className="flex items-end gap-1">
            วันที่
            <span className="w-13 border-b border-dotted border-black text-center font-semibold">
              {billedAt.getDate()}
            </span>
          </p>
          <p className="flex items-end gap-1">
            เดือน
            <span className="w-23 border-b border-dotted border-black text-center font-semibold">
              {billedAt.toLocaleDateString("th-TH", { month: "long" })}
            </span>
          </p>
          <p className="flex items-end gap-1">
            พ.ศ.
            <span className="w-13 border-b border-dotted border-black text-center font-semibold">
              {billedAt.getFullYear() + 543}
            </span>
          </p>
        </div>

        <div className="mt-1.5 space-y-[5px]">
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">ชื่อลูกค้า</span>
            <span className="min-w-0 flex-1 truncate border-b border-dotted border-black text-center font-semibold">
              {customer?.name || ""}
            </span>
          </p>
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">ที่อยู่</span>
            {/* บรรทัดเดียวเสมอ ไม่งั้นความสูงหัวกระดาษเปลี่ยนแล้วจำนวนบิลต่อแผ่นที่คำนวณไว้จะผิด */}
            <span className="min-w-0 flex-1 truncate border-b border-dotted border-black text-center font-semibold">
              {customer?.address || ""}
            </span>
          </p>
          <p className="grid grid-cols-[60px_minmax(0,1.7fr)_74px_1fr] items-end gap-1.5 whitespace-nowrap">
            <span className="col-span-2 flex items-end gap-1.5">
              <span>เลขประจำตัวผู้เสียภาษีอากร</span>
              <span className="flex-1 border-b border-dotted border-black px-1 text-center font-semibold">
                {customer?.taxId || ""}
              </span>
            </span>
            <span>เบอร์โทรศัพท์</span>
            <span className="border-b border-dotted border-black text-center font-semibold">
              {customer?.phoneNumber ? formatPhone(customer.phoneNumber) : ""}
            </span>
          </p>
          {/* เว้นไว้ให้เขียนตอนวางบิล แต่ละหน่วยงานรอบจ่ายไม่เท่ากัน จำนวนบิลดูจากคอลัมน์ลำดับ */}
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">วันนัดชำระ</span>
            <span className="h-full flex-1 border-b border-dotted border-black" />
          </p>
        </div>

        <table className="mt-2 w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="w-10 border border-black p-[3px] font-semibold">
                ลำดับ
              </th>
              <th className="w-28 border border-black p-[3px] font-semibold">
                เลขที่ใบส่งของ
              </th>
              <th className="w-25 border border-black p-[3px] font-semibold">
                วันที่
              </th>
              <th className="border border-black p-[3px] font-semibold">
                รายละเอียด
              </th>
              <th className="w-23 border border-black p-[3px] font-semibold">
                จำนวนเงิน
              </th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair, index) => (
              <tr key={repair.id}>
                <td className="border border-black px-1 text-center">
                  {startIndex + index + 1}
                </td>
                {/* บิลเครดิตอ้างเลขใบส่งของที่ลูกค้าเซ็นรับไว้ */}
                <td className="border border-black px-1 text-center whitespace-nowrap">
                  {repair.deliveryNo || repair.receiptNo || repair.id}
                </td>
                <td className="border border-black px-1 text-center whitespace-nowrap">
                  {formatDateShort(repair.createdAt)}
                </td>
                <td className="truncate border border-black px-1">
                  {getRepairTitle(repair) === "ไม่ระบุทะเบียนรถ"
                    ? getDisplayBrand(repair.vehicle?.vehicleModel) || "งานซ่อม"
                    : getRepairTitle(repair, shortProvince)}
                  {repair.vehicle?.fleetNo &&
                    ` เบอร์รถ ${repair.vehicle.fleetNo}`}
                </td>
                <td className="border border-black px-1 text-right">
                  {money(repair.totalPrice)}
                </td>
              </tr>
            ))}
            {isLastPage && (
              <tr className="bg-gray-200">
                <td colSpan={4} className="border border-black px-1 py-[5px]">
                  <span className="mr-1.5">จำนวนเงินรวมทั้งสิ้น</span>
                  <span className="font-semibold">{bahtText(total)}</span>
                </td>
                <td className="border border-black px-1 text-right text-[13pt] font-semibold">
                  {money(total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ลูกค้าซ้าย ร้านขวา แบบเดียวกับใบเสร็จและใบส่งของ (ต้องตรงกับ buildOrganizationBillHtml) */}
        {isLastPage ? (
          <div className="mt-5.5 flex justify-between gap-4">
            {["ผู้รับวางบิล", "ผู้วางบิล"].map((label) => (
              <p key={label} className="flex flex-1 items-end gap-1">
                ลงชื่อ
                <span className="flex-1 border-b border-dotted border-black" />
                {label}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {/* ลูกค้าจ่ายตามใบวางบิล QR จึงอยู่ที่นี่ ขนาดเท่าใบเสร็จ (ดู .receipt-qr ใน index.css) */}
      {isLastPage && (
        <div className="receipt-qr-area">
          <div className="receipt-qr">
            <img
              src="/promptpay-logo-bw.jpg"
              alt="พร้อมเพย์"
              className="receipt-qr-logo"
            />
            <img
              src="/payment-qr.svg"
              alt="QR รับเงิน"
              className="receipt-qr-code"
            />
            <p className="receipt-qr-name">{PAYMENT_QR_NAME}</p>
            <p className="receipt-qr-hint">สแกนเพื่อชำระเงิน</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditSummaryPaper;
