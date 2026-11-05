import { Fragment } from "react";
import { formatQuantity } from "@/utils/formats";
import {
  JOB_SHEET,
  jobRowName,
  jobSheetNo,
  jobSheetPages,
  receiptHeaderInfo,
  unitOf,
} from "@/utils/receipt";

// ไม่ใส่ราคา เพราะใบนี้วางอยู่หน้ารถให้คนเดินผ่านเห็นได้
// แผ่นสุดท้ายมีแถวว่างไว้เขียนงานที่เจอหน้างาน

// งานที่ไม่มีหน่วยและทำครั้งเดียว เช่น ตั้งศูนย์ ไม่ต้องบอกจำนวน (ต้องตรงกับ jobQuantity ฝั่งเซิร์ฟเวอร์)
const jobQuantity = (item, quantity) =>
  !unitOf(item) && Number(quantity) === 1
    ? ""
    : `${formatQuantity(quantity)} ${unitOf(item)}`.trim();

// แผ่นละหน้า บิลยาวแบ่งหลายแผ่น (ดู jobSheetPages)
const JobSheetPaper = ({ repair, pageIndex = 0 }) => {
  const { vehicleName, plateText } = receiptHeaderInfo(repair);
  const { pages, hasSides } = jobSheetPages(repair);
  const page = pages[pageIndex] || pages[0];
  const docNo = jobSheetNo(repair);
  const listHeading = page.others.length
    ? hasSides
      ? "อื่นๆ"
      : "รายการ"
    : "เพิ่มเติม";

  const halfCells = (row, side, isRight) => {
    const edge = isRight ? "border-l-2" : "";
    return (
      <Fragment key={side}>
        <td className={`h-8.5 border border-black px-1 break-words ${edge}`}>
          {row && jobRowName(row)}
        </td>
        <td className="border border-black px-1 text-center">
          {row && jobQuantity(row.item, row.quantity)}
        </td>
      </Fragment>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-black pb-1">
        <p className="text-[17pt] leading-none font-semibold">ใบสั่งซ่อม</p>
        <p className="flex items-end gap-1 text-[12pt] whitespace-nowrap">
          เลขที่
          <span className="min-w-10.5 border-b border-dotted border-black text-center font-semibold">
            {pages.length > 1 ? `${docNo}/${pageIndex + 1}` : docNo}
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

      {/* อาการที่ลูกค้าแจ้ง ช่างต้องอ่านก่อนลงมือ จึงเป็นกล่องเด่นเหนือตาราง (ต้องตรงกับ .note ฝั่งเซิร์ฟเวอร์) */}
      {pageIndex === 0 && repair.description && (
        <div className="mt-2.5 border border-black">
          <p className="border-b border-black bg-gray-200 px-2 py-[3px] text-[16px] font-semibold">
            รายละเอียดการซ่อม
          </p>
          <p className="px-2 pt-[5px] pb-1.5 text-[16pt] leading-[1.3] font-semibold break-words whitespace-pre-wrap">
            {repair.description}
          </p>
        </div>
      )}

      {page.sides.length > 0 && (
        <table className="mt-2.5 w-full table-fixed border-collapse text-[12pt]">
          <colgroup>
            <col />
            <col className="w-15.5" />
            <col />
            <col className="w-15.5" />
          </colgroup>
          <thead>
            {/* หัวข้อข้างตัวใหญ่ และเส้นกลางหนาแบ่งสองข้าง มองออกแม้พิมพ์ขาวดำ */}
            <tr className="bg-gray-200">
              <th
                colSpan={2}
                className="border border-black px-2 py-1 text-[14pt] font-semibold"
              >
                ข้างซ้าย (L)
              </th>
              <th
                colSpan={2}
                className="border border-l-2 border-black px-2 py-1 text-[14pt] font-semibold"
              >
                ข้างขวา (R)
              </th>
            </tr>
          </thead>
          <tbody>
            {page.sides.map(([left, right], index) => (
              <tr key={index}>
                {halfCells(left, "left", false)}
                {halfCells(right, "right", true)}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(page.others.length > 0 || page.extra) && (
        <table className="mt-2.5 w-full table-fixed border-collapse text-[12pt]">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-[5px] text-left font-semibold">
                {listHeading}
              </th>
              <th className="w-23 border border-black p-[5px] font-semibold">
                จำนวน
              </th>
            </tr>
          </thead>
          <tbody>
            {page.others.map((row) => (
              <tr key={row.item.id}>
                <td className="h-8.5 border border-black px-2 break-words">
                  {jobRowName(row)}
                </td>
                <td className="border border-black px-2 text-center">
                  {jobQuantity(row.item, row.quantity)}
                </td>
              </tr>
            ))}
            {/* หัวข้อเพิ่มเติมเป็นแถวหัวตารางอีกแถว มีช่องจำนวนเหมือนหัวข้ออื่นๆ */}
            {page.extra && page.others.length > 0 && (
              <tr className="bg-gray-200">
                <th className="border border-black p-[5px] text-left font-semibold">
                  เพิ่มเติม
                </th>
                <th className="border border-black p-[5px] font-semibold">
                  จำนวน
                </th>
              </tr>
            )}
            {Array.from({ length: page.extra ? JOB_SHEET.blankRows : 0 }).map(
              (_, index) => (
                <tr key={`blank-${index}`}>
                  <td className="h-8.5 border border-black" />
                  <td className="border border-black" />
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </>
  );
};

export default JobSheetPaper;
