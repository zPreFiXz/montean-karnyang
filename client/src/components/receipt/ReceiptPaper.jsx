import { formatQuantity, formatPlate } from "@/utils/formats";
import { bahtText } from "@/utils/bahtText";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { getPartType } from "@/utils/suspension";
import { getOilSize } from "@/utils/oil";
import { VEHICLE_COMPATIBLE_CATEGORIES } from "@/constants/categories";
import { isDiscountItem } from "@/constants/services";

// ข้อมูลร้านที่พิมพ์ไว้บนหัวใบเสร็จเล่มกระดาษ ใช้ชุดเดียวกันเพื่อให้ใบที่พิมพ์ออกมาหน้าตาเหมือนกัน
export const SHOP = {
  name: "ร้านมณเฑียรการยาง",
  address: "543 หมู่ที่ 5 ตำบลน้ำอ้อม อำเภอกันทรลักษ์ จังหวัดศรีสะเกษ 33110",
  contact:
    "โทร. 089-849-2861, 093-326-1705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

// ใบเสร็จกระดาษมีเส้นว่างไว้เขียนเพิ่ม ใบที่พิมพ์จึงเติมแถวเปล่าให้ตารางสูงเท่ากันทุกใบ
const MIN_ROWS = 10;

// ช่องติ๊กวิธีจ่ายบนใบเสร็จ เรียงตามที่ร้านใช้บ่อย (เช็คไม่มีในระบบ เว้นไว้ให้ติ๊กมือ)
const PAYMENT_BOXES = [
  { label: "เงินสด", method: "CASH" },
  { label: "สแกนจ่าย", method: "QR_CODE" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: null },
];

// ช่างดูจากชนิดอะไหล่ ไม่ได้ดูยี่ห้อหรือรุ่น ชื่อในบิลมีทั้งสองอย่างต่อท้ายจนยาว
// ของช่วงล่างจึงตัดเหลือคำแรกของชื่อในคลัง ซึ่งเป็นชนิดอะไหล่พอดี (ลูกหมากบน คันชักนอก)
export const shortWorkName = (item) => {
  // พิมพ์ชื่อทับไว้เอง = ตั้งใจให้ขึ้นแบบนั้น ไม่ต้องย่อทับ
  // ชื่อที่ระบบประกอบเองจะมีชื่อในคลังอยู่ข้างในเสมอ ถ้าไม่มีแปลว่าถูกพิมพ์ใหม่
  if (
    item.part?.name &&
    !String(item.itemName || "").includes(item.part.name)
  ) {
    return item.itemName;
  }

  // หมวดที่อะไหล่ผูกกับรุ่นรถ ชื่อในคลังจะเป็น "ยี่ห้อ ชนิด รุ่นรถ" เสมอ
  // ตัดเหลือคำแรกซึ่งเป็นชนิดอะไหล่ (ลูกหมากบน คันชักนอก ผ้าเบรคหน้า)
  if (
    VEHICLE_COMPATIBLE_CATEGORIES.includes(item.part?.category?.name) &&
    item.part?.name
  ) {
    return getPartType(item.part.name);
  }

  // น้ำมันส่วนใหญ่เป็นบรรทัดที่พิมพ์ชื่อเอง ดูจากชื่อแทนหมวดหมู่
  // เอาแค่ขนาดลิตรกับชื่อของ ตัดยี่ห้อ เกรด และของแถมพ่วงท้ายออกให้หมด
  // "VALVOLINE (3L) น้ำมันเครื่อง+กรอง SYNPOWER ECO (0W30)" -> "(3L) น้ำมันเครื่อง+กรอง"
  // "VALVOLINE น้ำมันเบรค (DOT3)" -> "น้ำมันเบรค"
  const name = String(item.itemName || "");
  if (name.includes("น้ำมัน")) {
    const thai = name.match(/[ก-๙][ก-๙+\s-]*[ก-๙]/);
    if (thai) {
      const base = thai[0].trim();
      const size = getOilSize(name);
      if (base) return size ? `(${size}) ${base}` : base;
    }
  }

  return item.itemName;
};

// บิลใบนี้มีของที่ย่อชื่อได้ไหม ถ้าไม่มีก็ไม่ต้องมีสวิตช์ให้กด
export const hasShortenableName = (items = []) =>
  items.some((item) => shortWorkName(item) !== item.itemName);

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ของแถมคิดราคา 0 ในเล่มกระดาษร้านขีด - ไว้ ไม่ได้เขียนเลขศูนย์
const formatAmount = (value) =>
  Number(value) === 0 ? "-" : formatMoney(value);

// หน่วยเก็บไว้กับอะไหล่ในคลัง อะไหล่ที่ซื้อมาใช้เลยไม่มีของในคลังจึงนับเป็นชิ้น
// ส่วนงานบริการไม่มีหน่วย เขียนแต่จำนวนเหมือนที่เขียนมือในเล่ม
// หน่วยมาจากอะไหล่ในคลังเท่านั้น บรรทัดที่พิมพ์ชื่อเอง ทั้งอะไหล่อื่นๆ และบริการ
// ไม่รู้ว่านับเป็นอะไร จึงเขียนแต่จำนวนเปล่าๆ เหมือนที่เขียนมือในเล่ม
export const unitOf = (item) => item.part?.unit || "";

// บิลเช็กช่วงล่างเก็บข้างที่ใส่ไว้กับแต่ละบรรทัด ใบจึงต้องบอกด้วยว่าเปลี่ยนของข้างไหน
// ของชิ้นเดียวกันที่ใส่ทั้งสองข้างยุบเป็นแถวเดียวแล้วห้อยท้ายว่า L-R
export const mergeBySide = (items) => {
  const rows = [];
  const byKey = new Map();

  for (const item of items) {
    const side = item.side === "LEFT" ? "L" : item.side === "RIGHT" ? "R" : "";
    if (!side) {
      rows.push({ item, quantity: Number(item.quantity), sides: [] });
      continue;
    }

    const key = `${item.itemName}|${item.unitPrice}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += Number(item.quantity);
      if (!existing.sides.includes(side)) existing.sides.push(side);
      continue;
    }

    const row = { item, quantity: Number(item.quantity), sides: [side] };
    byKey.set(key, row);
    rows.push(row);
  }

  return rows.map((row) => ({
    ...row,
    sideLabel:
      row.sides.includes("L") && row.sides.includes("R")
        ? "L-R"
        : row.sides[0] || "",
  }));
};

// ข้อมูลหัวใบที่ใบเสร็จกับใบสั่งงานใช้ร่วมกัน
// ชื่อเอกสารเปลี่ยนตามสถานะ เพราะเรียกว่าใบเสร็จรับเงินได้เฉพาะตอนรับเงินแล้วจริง
// ใบประเมินราคา = ยังไม่ได้ซ่อม เป็นใบเสนอราคา
// เครดิต = ซ่อมแล้วแต่ยังไม่ได้เงิน เป็นใบส่งของ
export const receiptDocTitle = (repair) => {
  if (repair?.status === "ESTIMATE") return "ใบเสนอราคา";
  if (repair?.status === "CREDIT") return "ใบส่งของ";
  return "ใบเสร็จรับเงิน";
};

export const receiptHeaderInfo = (repair) => {
  const issuedAt = new Date(repair.paidAt || repair.createdAt || Date.now());
  const plate = repair.vehicle?.licensePlate;

  return {
    day: issuedAt.getDate(),
    month: issuedAt.toLocaleDateString("th-TH", { month: "long" }),
    // ใบเสร็จไทยเขียนปี พ.ศ. สองหลัก ตามที่เขียนมือในเล่ม
    year: String(issuedAt.getFullYear() + 543).slice(-2),
    vehicleName: getDisplayBrand(repair.vehicle?.vehicleModel) || "",
    plateText: plate?.plateNumber
      ? `${formatPlate(plate.plateNumber)} ${plate.province || ""}`.trim()
      : "",
  };
};

// บิลที่มีรายการเกินหนึ่งหน้าให้แยกเป็นใบต่อไป แผ่นละ MIN_ROWS บรรทัด
// ยอดรวมกับส่วนลดอยู่แผ่นสุดท้ายแผ่นเดียว ไม่งั้นอ่านแล้วนึกว่าจ่ายหลายรอบ
export const buildReceiptPages = (repair) => {
  const allItems = repair?.repairItems || [];
  const discountItems = allItems.filter(isDiscountItem);
  const rows = mergeBySide(allItems.filter((item) => !isDiscountItem(item)));

  const pages = [];
  for (
    let start = 0;
    start < rows.length || pages.length === 0;
    start += MIN_ROWS
  ) {
    pages.push(rows.slice(start, start + MIN_ROWS));
  }

  // แถวยอดรวมกับส่วนลดกินที่ของแผ่นสุดท้าย ถ้าไม่พอก็ขึ้นแผ่นใหม่ให้
  const lastPage = pages[pages.length - 1];
  const summaryRows = discountItems.length ? discountItems.length + 1 : 1;
  if (lastPage.length + summaryRows > MIN_ROWS) pages.push([]);

  return { pages, discountItems };
};

export const receiptPageCount = (repair) =>
  buildReceiptPages(repair).pages.length;

// เนื้อในของใบเสร็จหนึ่งแผ่น กระดาษกับการย่อขนาดอยู่ที่ ReceiptPreviewDialog
const ReceiptPaper = ({
  repair,
  showCustomer = true,
  showBrand = true,
  pageIndex = 0,
}) => {
  const { day, month, year, vehicleName, plateText } =
    receiptHeaderInfo(repair);
  const customerName = repair.customer?.name || "";
  const customerAddress = repair.customer?.address || "";

  const { pages, discountItems } = buildReceiptPages(repair);
  const pageCount = pages.length;
  const items = pages[pageIndex] || [];
  const isLastPage = pageIndex === pageCount - 1;

  // ส่วนลดไม่ใช่ของที่ขาย ยกออกจากตารางไปไว้เป็นแถวใต้ยอดรวมแทน อ่านง่ายกว่าปนอยู่กลางรายการ
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  const hasDiscount = isLastPage && discountTotal !== 0;
  const summaryRows = isLastPage
    ? hasDiscount
      ? discountItems.length + 1
      : 1
    : 0;
  const blankRows = Math.max(0, MIN_ROWS - items.length - summaryRows);
  // ยอดในบิลหักส่วนลดไปแล้ว ยอดก่อนหักจึงต้องบวกกลับ (ส่วนลดเก็บเป็นเลขติดลบ)
  const total = Number(repair.totalPrice || 0);
  const subtotal = total - discountTotal;

  return (
    <>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-[8px]">
        <p className="flex items-end gap-[4px] whitespace-nowrap">
          เล่มที่
          <span className="w-[70px] border-b border-dotted border-black" />
        </p>
        <div className="text-center">
          <p className="text-[15pt] font-semibold">{receiptDocTitle(repair)}</p>
          <p className="text-[17pt] font-semibold">{SHOP.name}</p>
        </div>
        <p className="flex items-end justify-end gap-[4px] whitespace-nowrap">
          เลขที่
          {/* บิลหลายแผ่นเขียนเลขต่อเนื่องแบบ 122/1 122/2 ตามแบบเอกสารต่อเนื่องของไทย */}
          <span className="min-w-[42px] border-b border-dotted border-black text-center font-semibold">
            {pageCount > 1 ? `${repair.id}/${pageIndex + 1}` : repair.id}
          </span>
        </p>
      </div>

      <p className="mt-[2px] text-center">{SHOP.address}</p>
      <p className="text-center">{SHOP.contact}</p>

      <div className="mt-[8px] flex justify-end gap-[12px]">
        <p className="flex items-end gap-[4px]">
          วันที่
          <span className="w-[52px] border-b border-dotted border-black text-center font-semibold">
            {day}
          </span>
        </p>
        <p className="flex items-end gap-[4px]">
          เดือน
          <span className="w-[92px] border-b border-dotted border-black text-center font-semibold">
            {month}
          </span>
        </p>
        <p className="flex items-end gap-[4px]">
          พ.ศ.
          <span className="w-[52px] border-b border-dotted border-black text-center font-semibold">
            {year}
          </span>
        </p>
      </div>

      <div className="mt-[6px] space-y-[5px]">
        {/* ปิดสวิตช์แล้วเว้นช่องไว้เฉยๆ ไม่เอาบรรทัดออก
                ใบจะได้หน้าตาเหมือนเดิมทุกครั้งและเขียนมือเพิ่มทีหลังได้ */}
        <p className="flex items-end gap-[6px]">
          <span className="whitespace-nowrap">ชื่อลูกค้า</span>
          <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
            {showCustomer ? customerName : ""}
          </span>
        </p>
        <p className="flex items-end gap-[6px]">
          <span className="whitespace-nowrap">ที่อยู่</span>
          <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
            {showCustomer ? customerAddress : ""}
          </span>
        </p>
        {/* ช่องนี้มีในเล่มจริง ร้านเว้นว่างไว้เกือบทุกใบ แต่ต้องมีให้กรอกมือได้ */}
        <p className="flex items-end gap-[6px]">
          <span className="whitespace-nowrap">เลขประจำตัวผู้เสียภาษีอากร</span>
          <span className="flex-1 border-b border-dotted border-black" />
        </p>
        {/* รถอยู่บรรทัดของตัวเอง เพราะใบเสร็จของร้านยางต้องรู้ว่าเป็นของคันไหน */}
        <p className="flex items-end gap-[6px]">
          <span className="whitespace-nowrap">ยี่ห้อ-รุ่นรถ</span>
          {/* สองช่องกว้างเท่ากัน แบ่งที่ว่างที่เหลือคนละครึ่ง */}
          <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
            {vehicleName}
          </span>
          <span className="whitespace-nowrap">ทะเบียนรถ</span>
          <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
            {plateText}
          </span>
        </p>
      </div>

      <table className="mt-[8px] w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-[62px] border border-black p-[3px] font-semibold">
              จำนวน
            </th>
            <th className="border border-black p-[3px] font-semibold">
              รายการ
            </th>
            <th className="w-[108px] border border-black p-[3px] font-semibold whitespace-nowrap">
              ราคาต่อหน่วย
            </th>
            <th className="w-[92px] border border-black p-[3px] font-semibold">
              จำนวนเงิน
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ item, quantity, sideLabel }) => {
            const amount = Number(item.unitPrice) * quantity;
            return (
              <tr key={item.id}>
                <td className="h-[22px] border border-black px-[3px] text-center">
                  {`${formatQuantity(quantity)} ${unitOf(item)}`.trim()}
                </td>
                <td className="border border-black px-[4px] break-words">
                  {showBrand ? item.itemName : shortWorkName(item)}
                  {sideLabel ? ` (${sideLabel})` : ""}
                </td>
                <td className="border border-black px-[4px] text-right">
                  {formatAmount(item.unitPrice)}
                </td>
                <td className="border border-black px-[4px] text-right">
                  {formatAmount(amount)}
                </td>
              </tr>
            );
          })}
          {Array.from({ length: blankRows }).map((_, index) => (
            <tr key={`blank-${index}`}>
              <td className="h-[22px] border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
              <td className="border border-black" />
            </tr>
          ))}
          {hasDiscount && (
            <>
              <tr>
                {/* ฝั่งซ้ายของสองแถวนี้ปล่อยโล่ง ไม่ต้องตีเส้นเป็นช่องเปล่า */}
                <td colSpan={2} />
                <td className="border border-black px-[4px] text-center whitespace-nowrap">
                  รวมเป็นเงิน
                </td>
                <td className="border border-black px-[4px] text-right">
                  {formatMoney(subtotal)}
                </td>
              </tr>
              {/* ส่วนลดตั้งชื่อเองได้ และมีได้หลายบรรทัด แยกแถวละรายการตามชื่อที่ตั้งไว้ */}
              {discountItems.map((item) => (
                <tr key={item.id}>
                  <td colSpan={2} />
                  <td className="border border-black px-[4px] text-center">
                    {item.itemName}
                  </td>
                  <td className="border border-black px-[4px] text-right">
                    {formatMoney(
                      Number(item.unitPrice) * Number(item.quantity),
                    )}
                  </td>
                </tr>
              ))}
            </>
          )}
          {isLastPage && (
            <tr className="bg-gray-200">
              <td colSpan={2} className="border border-black px-[4px] py-[5px]">
                <span className="mr-[6px]">จำนวนเงินรวมทั้งสิ้น</span>
                <span className="font-semibold">{bahtText(total)}</span>
              </td>
              <td className="border border-black px-[4px] text-center whitespace-nowrap">
                จำนวนเงินรวม
              </td>
              {/* ยอดรวมคือตัวเลขที่ลูกค้ามองหา จึงใหญ่กว่ายอดของแต่ละรายการหนึ่งขั้น */}
              <td className="border border-black px-[4px] text-right text-[13pt] font-semibold">
                {formatMoney(total)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* เล่มกระดาษมีแค่เงินสดกับเช็ค แต่ร้านรับโอนกับบัตรด้วย จึงเพิ่มอีกสองช่อง
                ติ๊กให้เองตามวิธีที่บันทึกไว้ในบิล */}
      <div className="mt-[8px] flex items-center gap-[20px]">
        {PAYMENT_BOXES.map((box) => (
          <span key={box.label} className="flex items-center gap-[6px]">
            <span className="flex h-[13px] w-[13px] items-center justify-center border border-black text-[10px] leading-none">
              {/* เช็คไม่มีในระบบ (method เป็นว่าง) บิลที่ยังไม่ได้เก็บเงินก็ว่างเหมือนกัน
                  ต้องเช็คว่ามีวิธีจ่ายจริงก่อน ไม่งั้นจะไปติ๊กช่องเช็คให้เอง */}
              {box.method && repair.paymentMethod === box.method ? "✓" : ""}
            </span>
            {box.label}
          </span>
        ))}
      </div>

      {/* แถวของเช็คในเล่มจริง เว้นว่างไว้ให้เขียนมือเหมือนเดิม
          สี่ช่องกว้างเท่ากัน แบ่งที่ว่างเท่าๆ กัน อ่านเป็นแถวเดียวกันได้ */}
      <div className="mt-[6px] flex items-end gap-[8px]">
        {["ธนาคาร", "เลขที่", "ลงวันที่", "จำนวนเงิน"].map((label) => (
          <span key={label} className="flex flex-1 items-end gap-[4px]">
            <span className="whitespace-nowrap">{label}</span>
            <span className="flex-1 border-b border-dotted border-black" />
          </span>
        ))}
      </div>

      <div className="mt-[22px] flex justify-between gap-[16px]">
        <p className="flex flex-1 items-end gap-[4px]">
          ลงชื่อ
          <span className="flex-1 border-b border-dotted border-black" />
          ผู้รับเงิน
        </p>
        <p className="flex flex-1 items-end gap-[4px]">
          ลงชื่อ
          <span className="flex-1 border-b border-dotted border-black" />
          ผู้จ่ายเงิน
        </p>
      </div>
    </>
  );
};

export default ReceiptPaper;
