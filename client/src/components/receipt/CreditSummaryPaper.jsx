import { SHOP } from "@/components/receipt/ReceiptPaper";
import { bahtText } from "@/utils/bahtText";
import { formatDateShort } from "@/utils/formats";
import { getDisplayBrand, getRepairTitle } from "@/utils/repairDisplay";

// แผ่นแรกของใบวางบิล: สรุปว่าหน่วยงานหรือร้านค้านั้นค้างบิลอะไรบ้างรวมเท่าไหร่
// ต้องตรงกับ buildOrganizationBillHtml ใน server/utils/receiptHtml.js
const money = (value) => Number(value || 0).toLocaleString("th-TH");

const CreditSummaryPaper = ({ customer, repairs }) => {
  const total = repairs.reduce(
    (sum, repair) => sum + Number(repair.totalPrice || 0),
    0,
  );

  return (
    <>
      <div className="text-center">
        <p className="text-[15pt] font-semibold">ใบวางบิล</p>
        <p className="text-[17pt] font-semibold">{SHOP.name}</p>
      </div>

      <p className="mt-[2px] text-center">{SHOP.address}</p>
      <p className="text-center">{SHOP.contact}</p>

      {/* ใช้คำเดียวกับใบเสร็จ และจัดกึ่งกลางบนเส้นประเหมือนกัน */}
      <p className="mt-[12px] flex items-end gap-[6px]">
        ชื่อลูกค้า
        <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
          {customer?.name || ""}
        </span>
        {/* จำนวนบิลเป็นข้อมูลของหัวเอกสาร อ่านคู่กับชื่อว่าใบนี้ของใครและมีกี่บิล */}
        <span className="whitespace-nowrap">จำนวน {repairs.length} บิล</span>
      </p>

      <table className="mt-[8px] w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-[52px] border border-black p-[3px] font-semibold">
              เลขที่
            </th>
            <th className="w-[86px] border border-black p-[3px] font-semibold">
              วันที่
            </th>
            <th className="border border-black p-[3px] font-semibold">
              รายการ
            </th>
            <th className="w-[92px] border border-black p-[3px] font-semibold">
              จำนวนเงิน
            </th>
          </tr>
        </thead>
        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id}>
              <td className="border border-black px-[4px] text-center">
                {repair.id}
              </td>
              <td className="border border-black px-[4px] text-center">
                {formatDateShort(repair.createdAt)}
              </td>
              <td className="border border-black px-[4px] break-words">
                {/* รถที่ไม่มีทะเบียน บอกยี่ห้อกับรุ่นแทน จะได้ยังรู้ว่าเป็นคันไหน */}
                {getRepairTitle(repair) === "ไม่ระบุทะเบียนรถ"
                  ? getDisplayBrand(repair.vehicle?.vehicleModel) || "งานซ่อม"
                  : getRepairTitle(repair)}
              </td>
              <td className="border border-black px-[4px] text-right">
                {money(repair.totalPrice)}
              </td>
            </tr>
          ))}
          {/* แถวรวมวางแบบเดียวกับท้ายใบเสร็จ คือตัวหนังสือซ้าย ยอดขวา */}
          <tr className="bg-gray-200">
            <td colSpan={3} className="border border-black px-[4px] py-[5px]">
              <span className="mr-[6px]">จำนวนเงินรวมทั้งสิ้น</span>
              <span className="font-semibold">{bahtText(total)}</span>
            </td>
            {/* ยอดรวมคือตัวเลขที่คนรับใบนี้มองหา จึงใหญ่กว่ายอดของแต่ละบิลหนึ่งขั้น */}
            <td className="border border-black px-[4px] text-right text-[13pt] font-semibold">
              {money(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default CreditSummaryPaper;
