import { Fragment } from "react";
import { formatQuantity } from "@/utils/formats";
import {
  DEFAULT_LABOR_SERVICE_NAME,
  isDiscountItem,
} from "@/constants/services";
import {
  mergeBySide,
  unitOf,
  receiptHeaderInfo,
  shortWorkName,
} from "@/components/receipt/ReceiptPaper";

// ใบสั่งซ่อมสำหรับช่าง: อ่านจากระยะห่างได้ ทะเบียนตัวใหญ่สุด งานเป็นรายการมีช่องติ๊ก
// ตั้งใจไม่ใส่ราคา ช่างไม่ได้ใช้ และใบนี้วางอยู่หน้ารถให้คนเดินผ่านเห็นได้
// แถวว่างท้ายตารางไว้เขียนงานที่เจอหน้างาน สองแถวเท่ากันทุกบิล
const EXTRA_ROWS = 2;

const JobSheetPaper = ({ repair }) => {
  const { vehicleName, plateText } = receiptHeaderInfo(repair);

  // ช่างสองคนทำคนละฝั่ง จึงแบ่งงานเป็นท่อนตามฝั่งแทนที่จะเรียงปนกัน
  // ของชิ้นเดียวกันที่ใส่ทั้งสองข้างจะถูกแยกเป็นแถวของแต่ละฝั่ง ไม่ยุบเป็น R-L
  // ใบนี้เป็นใบของช่าง ไม่เกี่ยวกับเงิน ค่าแรงกับส่วนลดจึงไม่ต้องขึ้น
  const allItems = (repair.repairItems || []).filter(
    (item) =>
      !isDiscountItem(item) &&
      item.service?.name !== DEFAULT_LABOR_SERVICE_NAME &&
      item.itemName !== DEFAULT_LABOR_SERVICE_NAME,
  );
  const groups = [
    {
      key: "left",
      label: "ข้างซ้าย (L)",
      items: allItems.filter((i) => i.side === "LEFT"),
    },
    {
      key: "right",
      label: "ข้างขวา (R)",
      items: allItems.filter((i) => i.side === "RIGHT"),
    },
    {
      key: "other",
      label: "อื่นๆ",
      items: allItems.filter((i) => i.side !== "LEFT" && i.side !== "RIGHT"),
    },
  ].filter((group) => group.items.length > 0);

  // บิลที่ไม่ได้แยกข้างเลย (งานซ่อมทั่วไป) ไม่ต้องมีหัวข้อกลุ่มให้รกใบ
  const hasSides = allItems.some(
    (item) => item.side === "LEFT" || item.side === "RIGHT",
  );
  const items = mergeBySide(allItems);

  return (
    <>
      {/* หัวใบมีเส้นคาดบางๆ แทนพื้นทึบ ประหยัดหมึกและอ่านง่ายพอกัน */}
      <div className="flex items-center justify-between border-b border-black pb-[4px]">
        <p className="text-[17pt] leading-none font-semibold">ใบสั่งซ่อม</p>
        {/* เส้นประใต้เลขที่ ให้หน้าตาเข้าชุดกับใบเสร็จ */}
        <p className="flex items-end gap-[4px] text-[12pt] whitespace-nowrap">
          เลขที่
          <span className="min-w-[42px] border-b border-dotted border-black text-center font-semibold">
            {repair.id}
          </span>
        </p>
      </div>

      {/* ทะเบียนคือสิ่งที่ช่างใช้จับคู่ใบกับรถ จึงตัวใหญ่ที่สุดบนใบ */}
      <div className="mt-[10px] flex items-baseline justify-between gap-[12px] whitespace-nowrap">
        <p className="text-[22pt] leading-none font-semibold">
          {plateText || "ไม่ระบุทะเบียนรถ"}
        </p>
        <p className="min-w-0 truncate text-[16pt] leading-none font-semibold">
          {vehicleName}
        </p>
      </div>

      <table className="mt-[10px] w-full table-fixed border-collapse text-[12pt]">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-[36px] border border-black p-[5px] font-semibold">
              ✓
            </th>
            <th className="border border-black p-[5px] text-left font-semibold">
              รายการ
            </th>
            <th className="w-[92px] border border-black p-[5px] font-semibold">
              จำนวน
            </th>
          </tr>
        </thead>
        <tbody>
          {hasSides
            ? groups.map((group) => (
                <Fragment key={group.key}>
                  {/* แถบหัวข้าง กินความกว้างทั้งแถว ช่างมองปราดเดียวรู้ว่าท่อนไหนของตัวเอง */}
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black bg-gray-200 px-[8px] py-[3px] text-[16px] font-semibold"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {mergeBySide(group.items).map(({ item, quantity }) => (
                    <tr key={`${group.key}-${item.id}`}>
                      <td className="h-[34px] border border-black" />
                      <td className="border border-black px-[8px] break-words">
                        {shortWorkName(item)}
                      </td>
                      <td className="border border-black px-[8px] text-center">
                        {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            : items.map(({ item, quantity, sideLabel }) => (
                <tr key={item.id}>
                  <td className="h-[34px] border border-black" />
                  <td className="border border-black px-[8px] break-words">
                    {shortWorkName(item)}
                    {sideLabel ? ` (${sideLabel})` : ""}
                  </td>
                  <td className="border border-black px-[8px] text-center">
                    {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                  </td>
                </tr>
              ))}
          {/* แถบหัวบอกว่าท่อนนี้ไว้เขียนงานที่เจอหน้างาน ไม่ใช่ตารางเหลือท้ายใบ */}
          <tr>
            <td
              colSpan={3}
              className="border border-black bg-gray-200 px-[8px] py-[3px] text-[16px] font-semibold"
            >
              เพิ่มเติม
            </td>
          </tr>
          {Array.from({ length: EXTRA_ROWS }).map((_, index) => (
            <tr key={`blank-${index}`}>
              <td className="h-[34px] border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
            </tr>
          ))}
        </tbody>
      </table>

      {/* ไม่มีรายละเอียดก็ไม่ต้องมีบรรทัดเปล่าให้รกใบ ข้อความชิดซ้ายเหมือนเขียนมือ */}
      {repair.description && (
        <div className="mt-[10px] flex items-end gap-[6px] text-[16px]">
          <span className="font-semibold whitespace-nowrap">
            รายละเอียดการซ่อม
          </span>
          <span className="flex-1 border-b border-dotted border-black">
            {repair.description}
          </span>
        </div>
      )}
    </>
  );
};

export default JobSheetPaper;
