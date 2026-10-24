import { Fragment } from "react";
import { formatQuantity } from "@/utils/formats";
import { jobSheetNo } from "@/utils/receipt";
import {
  DEFAULT_LABOR_SERVICE_NAME,
  isDiscountItem,
} from "@/constants/services";
import {
  mergeBySide,
  unitOf,
  receiptHeaderInfo,
  shortWorkNameBase,
} from "@/utils/receipt";

// ไม่ใส่ราคา เพราะใบนี้วางอยู่หน้ารถให้คนเดินผ่านเห็นได้
// แถวว่างท้ายตารางไว้เขียนงานที่เจอหน้างาน
const EXTRA_ROWS = 2;

const JobSheetPaper = ({ repair }) => {
  const { vehicleName, plateText } = receiptHeaderInfo(repair);

  // แบ่งตามฝั่ง ของที่ใส่ทั้งสองข้างแยกเป็นแถวของแต่ละฝั่ง ไม่ยุบเป็น L-R
  // ค่าแรงกับส่วนลดไม่ต้องขึ้น ใบนี้ไม่เกี่ยวกับเงิน
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

  const hasSides = allItems.some(
    (item) => item.side === "LEFT" || item.side === "RIGHT",
  );
  const items = mergeBySide(allItems);

  return (
    <>
      <div className="flex items-center justify-between border-b border-black pb-1">
        <p className="text-[17pt] leading-none font-semibold">ใบสั่งซ่อม</p>
        <p className="flex items-end gap-1 text-[12pt] whitespace-nowrap">
          เลขที่
          <span className="min-w-10.5 border-b border-dotted border-black text-center font-semibold">
            {jobSheetNo(repair)}
          </span>
        </p>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-3 whitespace-nowrap">
        <p className="text-[22pt] leading-none font-semibold">
          {plateText || "ไม่ระบุทะเบียนรถ"}
          {repair.vehicle?.fleetNo && (
            <span className="ml-2 text-[16pt]">
              เบอร์รถ {repair.vehicle.fleetNo}
            </span>
          )}
        </p>
        <p className="min-w-0 truncate text-[16pt] leading-none font-semibold">
          {vehicleName}
        </p>
      </div>

      <table className="mt-2.5 w-full table-fixed border-collapse text-[12pt]">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-9 border border-black p-[5px] font-semibold">✓</th>
            <th className="border border-black p-[5px] text-left font-semibold">
              รายการ
            </th>
            <th className="w-23 border border-black p-[5px] font-semibold">
              จำนวน
            </th>
          </tr>
        </thead>
        <tbody>
          {hasSides
            ? groups.map((group) => (
                <Fragment key={group.key}>
                  <tr>
                    <td
                      colSpan={3}
                      className="border border-black bg-gray-200 px-2 py-[3px] text-[16px] font-semibold"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {mergeBySide(group.items).map(({ item, quantity }) => (
                    <tr key={`${group.key}-${item.id}`}>
                      <td className="h-8.5 border border-black" />
                      <td className="border border-black px-2 break-words">
                        {shortWorkNameBase(item)}
                      </td>
                      <td className="border border-black px-2 text-center">
                        {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            : items.map(({ item, quantity, sideLabel }) => (
                <tr key={item.id}>
                  <td className="h-8.5 border border-black" />
                  <td className="border border-black px-2 break-words">
                    {shortWorkNameBase(item)}
                    {sideLabel ? ` (${sideLabel})` : ""}
                  </td>
                  <td className="border border-black px-2 text-center">
                    {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                  </td>
                </tr>
              ))}
          <tr>
            <td
              colSpan={3}
              className="border border-black bg-gray-200 px-2 py-[3px] text-[16px] font-semibold"
            >
              เพิ่มเติม
            </td>
          </tr>
          {Array.from({ length: EXTRA_ROWS }).map((_, index) => (
            <tr key={`blank-${index}`}>
              <td className="h-8.5 border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
            </tr>
          ))}
        </tbody>
      </table>

      {repair.description && (
        <div className="mt-2.5 flex items-end gap-1.5 text-[16px]">
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
