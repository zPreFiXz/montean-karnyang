import { SHOP, shortProvince } from "@/utils/receipt";
import { bahtText } from "@/utils/bahtText";
import { formatDateShort } from "@/utils/formats";
import { getDisplayBrand, getRepairTitle } from "@/utils/repairDisplay";

// ต้องตรงกับ buildOrganizationBillHtml ใน server/utils/receiptHtml.js
const money = (value) => Number(value || 0).toLocaleString("th-TH");

const CreditSummaryPaper = ({ customer, repairs, billingNo }) => {
  const total = repairs.reduce(
    (sum, repair) => sum + Number(repair.totalPrice || 0),
    0,
  );

  return (
    <>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <span />
        <div className="text-center">
          <p className="text-[15pt] font-semibold">ใบวางบิล</p>
          <p className="text-[17pt] font-semibold">{SHOP.name}</p>
        </div>
        <p className="flex items-end justify-end gap-1 whitespace-nowrap">
          เลขที่
          <span className="min-w-10.5 border-b border-dotted border-black text-center font-semibold">
            {billingNo || ""}
          </span>
        </p>
      </div>

      <p className="mt-0.5 text-center">{SHOP.address}</p>
      <p className="text-center">{SHOP.contact}</p>

      <p className="mt-3 flex items-end gap-1.5">
        ชื่อลูกค้า
        <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
          {customer?.name || ""}
        </span>
        <span className="whitespace-nowrap">จำนวน {repairs.length} บิล</span>
      </p>

      <table className="mt-2 w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-28 border border-black p-[3px] font-semibold">
              เลขที่
            </th>
            <th className="w-21.5 border border-black p-[3px] font-semibold">
              วันที่
            </th>
            <th className="border border-black p-[3px] font-semibold">
              รายการ
            </th>
            <th className="w-23 border border-black p-[3px] font-semibold">
              จำนวนเงิน
            </th>
          </tr>
        </thead>
        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id}>
              {/* บิลเครดิตอ้างเลขใบส่งของที่ลูกค้าเซ็นรับไว้ */}
              <td className="border border-black px-1 text-center whitespace-nowrap">
                {repair.deliveryNo || repair.receiptNo || repair.id}
              </td>
              <td className="border border-black px-1 text-center">
                {formatDateShort(repair.createdAt)}
              </td>
              <td className="border border-black px-1 break-words">
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
          <tr className="bg-gray-200">
            <td colSpan={3} className="border border-black px-1 py-[5px]">
              <span className="mr-1.5">จำนวนเงินรวมทั้งสิ้น</span>
              <span className="font-semibold">{bahtText(total)}</span>
            </td>
            <td className="border border-black px-1 text-right text-[13pt] font-semibold">
              {money(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default CreditSummaryPaper;
