import { Fragment } from "react";
import { formatQuantity } from "@/utils/formats";
import { getPartType } from "@/utils/suspension";
import { SUSPENSION_CATEGORY } from "@/constants/categories";
import {
  DEFAULT_LABOR_SERVICE_NAME,
  isDiscountItem,
} from "@/constants/services";
import {
  mergeBySide,
  unitOf,
  receiptHeaderInfo,
} from "@/components/receipt/ReceiptPaper";

// ใบสั่งซ่อมสำหรับช่าง: อ่านจากระยะห่างได้ ทะเบียนตัวใหญ่สุด งานเป็นรายการมีช่องติ๊ก
// ตั้งใจไม่ใส่ราคา ช่างไม่ได้ใช้ และใบนี้วางอยู่หน้ารถให้คนเดินผ่านเห็นได้
const MIN_ROWS = 10;

// ช่างดูจากชนิดอะไหล่ ไม่ได้ดูยี่ห้อหรือรุ่น ชื่อในบิลมีทั้งสองอย่างต่อท้ายจนยาว
// ของช่วงล่างจึงตัดเหลือคำแรกของชื่อในคลัง ซึ่งเป็นชนิดอะไหล่พอดี (ลูกหมากบน คันชักนอก)
const workName = (item) =>
  item.part?.category?.name === SUSPENSION_CATEGORY && item.part?.name
    ? getPartType(item.part.name)
    : item.itemName;

const JobSheetPaper = ({ repair }) => {
  const { vehicleName, plateText } = receiptHeaderInfo(repair);

  // ช่างสองคนทำคนละฝั่ง จึงแบ่งงานเป็นท่อนตามฝั่งแทนที่จะเรียงปนกัน
  // ของชิ้นเดียวกันที่ใส่ทั้งสองข้างจะถูกแยกเป็นแถวของแต่ละฝั่ง ไม่ยุบเป็น L-R
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
      label: "ฝั่งซ้าย (L)",
      items: allItems.filter((i) => i.side === "LEFT"),
    },
    {
      key: "right",
      label: "ฝั่งขวา (R)",
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
  const blankRows = Math.max(0, MIN_ROWS - items.length);

  return (
    <>
      <div className="flex items-start justify-between gap-[8px]">
        <p className="text-[16pt] font-semibold">ใบสั่งซ่อม</p>
        <p className="flex items-end gap-[4px] text-[11pt]">
          เลขที่
          <span className="min-w-[42px] border-b border-dotted border-black text-center font-semibold">
            {repair.id}
          </span>
        </p>
      </div>

      {/* ทะเบียนคือสิ่งที่ช่างใช้จับคู่ใบกับรถ จึงตัวใหญ่ที่สุดบนใบ */}
      <div className="mt-[6px] border-2 border-black p-[8px]">
        {/* ทะเบียนกับยี่ห้อรุ่นสำคัญพอกันสำหรับช่าง ตัวเท่ากันและอยู่บรรทัดเดียว
            ห้ามตกบรรทัด ถ้าชื่อรุ่นยาวให้ตัดหางแทน กรอบจะได้สูงเท่ากันทุกใบ */}
        <p className="flex items-end justify-between gap-[12px] text-[18pt] leading-none font-bold whitespace-nowrap">
          <span>{plateText || "ไม่ระบุทะเบียนรถ"}</span>
          <span className="min-w-0 truncate">{vehicleName}</span>
        </p>
      </div>

      <table className="mt-[10px] w-full table-fixed border-collapse text-[12pt]">
        <thead>
          <tr>
            <th className="w-[34px] border border-black p-[4px] font-semibold">
              ✓
            </th>
            <th className="border border-black p-[4px] font-semibold">
              รายการ
            </th>
            <th className="w-[96px] border border-black p-[4px] font-semibold">
              จำนวน
            </th>
          </tr>
        </thead>
        <tbody>
          {hasSides
            ? groups.map((group) => (
                <Fragment key={group.key}>
                  {/* แถบหัวฝั่ง กินความกว้างทั้งแถว ช่างมองปราดเดียวรู้ว่าท่อนไหนของตัวเอง */}
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black bg-gray-200 px-[6px] text-[12pt] font-semibold"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {mergeBySide(group.items).map(({ item, quantity }) => (
                    <tr key={`${group.key}-${item.id}`}>
                      <td className="h-[34px] border border-black" />
                      <td className="border border-black px-[6px] break-words">
                        {workName(item)}
                      </td>
                      <td className="border border-black px-[6px] text-center">
                        {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            : items.map(({ item, quantity, sideLabel }) => (
                <tr key={item.id}>
                  <td className="h-[34px] border border-black" />
                  <td className="border border-black px-[6px] break-words">
                    {workName(item)}
                    {sideLabel ? ` (${sideLabel})` : ""}
                  </td>
                  <td className="border border-black px-[6px] text-center">
                    {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                  </td>
                </tr>
              ))}
          {/* แถบหัวบอกว่าท่อนนี้ไว้เขียนงานที่เจอหน้างาน ไม่ใช่ตารางเหลือท้ายใบ */}
          <tr>
            <td
              colSpan={3}
              className="border border-black bg-gray-200 px-[6px] text-[12pt] font-semibold"
            >
              เพิ่มเติม
            </td>
          </tr>
          {Array.from({ length: hasSides ? 4 : blankRows }).map((_, index) => (
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
        <div className="mt-[10px] flex items-end gap-[6px] text-[11pt]">
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
