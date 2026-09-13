import { useLayoutEffect, useRef, useState } from "react";
import { X, Printer, Plus, Minus } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatQuantity } from "@/utils/formats";
import { printRepairReceipt } from "@/api/repair";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import { bahtText } from "@/utils/bahtText";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { isPartPlaceholderItem } from "@/constants/services";

// ข้อมูลร้านที่พิมพ์ไว้บนหัวใบเสร็จเล่มกระดาษ ใช้ชุดเดียวกันเพื่อให้ใบที่พิมพ์ออกมาหน้าตาเหมือนกัน
const SHOP = {
  name: "ร้านมณเฑียรการยาง",
  address: "543 หมู่ที่ 5 ตำบลน้ำอ้อม อำเภอกันทรลักษ์ จังหวัดศรีสะเกษ 33110",
  contact:
    "โทร. 089-8492861, 093-3261705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

// ใบเสร็จกระดาษมีเส้นว่างไว้เขียนเพิ่ม ใบที่พิมพ์จึงเติมแถวเปล่าให้ตารางสูงเท่ากันทุกใบ
const MIN_ROWS = 12;

// ขนาดกระดาษ A5 เต็มแผ่น ขอบพิมพ์เว้นเองข้างใน (ดูกฎ @media print)
const PAPER_WIDTH_MM = 148;
const PAPER_HEIGHT_MM = 210;
// 1 มิลลิเมตร = 96/25.4 พิกเซลตามมาตรฐาน CSS ใช้คำนวณขนาดกรอบหลังย่อ
const MM = 96 / 25.4;

// ช่องติ๊กวิธีจ่ายบนใบเสร็จ เรียงตามที่ร้านใช้บ่อย (เช็คไม่มีในระบบ เว้นไว้ให้ติ๊กมือ)
const PAYMENT_BOXES = [
  { label: "เงินสด", method: "CASH" },
  { label: "สแกนจ่าย", method: "QR_CODE" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: null },
];

// ระยะห่างรอบกรอบดูตัวอย่าง ต้องตรงกับคลาสที่ใช้จริง
const VIEWPORT_MARGIN = 16;
// เพดานขนาดไดอะล็อก ต้องตรงกับคลาสที่ใช้จริงเช่นกัน
const DIALOG_MAX_WIDTH = 620;
const DIALOG_MAX_HEIGHT_RATIO = 0.9;

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2;

// หน่วยเก็บไว้กับอะไหล่ในคลัง อะไหล่ที่ซื้อมาใช้เลยไม่มีของในคลังจึงนับเป็นชิ้น
// ส่วนงานบริการไม่มีหน่วย เขียนแต่จำนวนเหมือนที่เขียนมือในเล่ม
const unitOf = (item) => {
  if (item.part?.unit) return item.part.unit;
  return isPartPlaceholderItem(item) ? "ชิ้น" : "";
};

// บิลเช็กช่วงล่างเก็บข้างที่ใส่ไว้กับแต่ละบรรทัด ใบเสร็จจึงต้องบอกด้วยว่าเปลี่ยนของข้างไหน
// ของชิ้นเดียวกันที่ใส่ทั้งสองข้างยุบเป็นแถวเดียวแล้วห้อยท้ายว่า L-R ใบจะได้ไม่ยาวเกินจำเป็น
const mergeBySide = (items) => {
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

  // เรียงซ้ายก่อนขวาเสมอ ไม่ใช่ตามลำดับที่ช่างติ๊กในหน้าจอ
  return rows.map((row) => ({
    ...row,
    sideLabel:
      row.sides.includes("L") && row.sides.includes("R")
        ? "L-R"
        : row.sides[0] || "",
  }));
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

const ReceiptPreviewDialog = ({ repair, open, onOpenChange }) => {
  // ตัวอย่างบนจอกับใบที่พิมพ์ต้องเป็นกระดาษแผ่นเดียวกันเป๊ะ
  // จึงวาดด้วยขนาดจริงของ A5 (หักขอบกระดาษแล้ว) แล้วย่อทั้งแผ่นให้พอดีความกว้างไดอะล็อก
  // ย่อด้วยการสเกล ไม่ใช่ปรับขนาดตัวอักษร สัดส่วนทุกอย่างจึงเท่าของจริง
  // สามส่วนที่ไม่ใช่กระดาษ ใช้วัดว่าเหลือที่ให้กระดาษเท่าไหร่
  const chromeRef = useRef(null);
  const zoomBarRef = useRef(null);
  const actionsRef = useRef(null);
  const paperRef = useRef(null);
  // ขนาดที่ทำให้ทั้งแผ่นพอดีกรอบ คิดจากทั้งกว้างและสูง จะได้เห็นครบโดยไม่ต้องเลื่อน
  const [fitScale, setFitScale] = useState(1);
  // ตัวคูณจากการซูมของผู้ใช้ 1 เท่ากับพอดีกรอบ
  const [zoom, setZoom] = useState(1);
  const [isPrintingAtShop, setIsPrintingAtShop] = useState(false);
  // เฟรมแรกกระดาษยังเป็นขนาดจริง ต้องรอวัดพื้นที่เสร็จก่อนถึงจะโชว์
  // ไม่งั้นจะเห็นแผ่นใหญ่วูบหนึ่งครั้งแล้วหดลงมา
  const [isMeasured, setIsMeasured] = useState(false);

  // useLayoutEffect เพราะต้องวัดและย่อให้เสร็จก่อนจอวาดเฟรมแรก
  // ถ้าวัดหลังวาด จะเห็นกล่องไดอะล็อกกางออกแล้วหดเข้ามาหนึ่งครั้ง
  useLayoutEffect(() => {
    if (!open) return;
    setZoom(1);
    setIsMeasured(false);

    const fit = () => {
      const chrome = chromeRef.current;
      const paper = paperRef.current;
      if (!paper) return;

      const paperWidth = paper.offsetWidth;
      const paperHeight = paper.offsetHeight;
      if (!paperWidth || !paperHeight) return;

      // คิดจากพื้นที่ว่างบนจอโดยตรง ไม่ใช่จากขนาดไดอะล็อก
      // เพราะไดอะล็อกจะหดตามกระดาษ ถ้าวัดจากมันจะกลายเป็นวนกันเอง
      const maxDialogWidth = Math.min(DIALOG_MAX_WIDTH, window.innerWidth - 32);
      const availableWidth = maxDialogWidth - VIEWPORT_MARGIN * 2;
      const chromeHeight =
        (chrome?.offsetHeight || 0) +
        (zoomBarRef.current?.offsetHeight || 0) +
        (actionsRef.current?.offsetHeight || 0);
      const availableHeight =
        window.innerHeight * DIALOG_MAX_HEIGHT_RATIO -
        chromeHeight -
        VIEWPORT_MARGIN * 2;
      if (availableWidth <= 0 || availableHeight <= 0) return;

      // เผื่อไว้เล็กน้อย กันเศษปัดของเบราว์เซอร์ทำให้ล้นออกไปหนึ่งจุดแล้วมีแถบเลื่อนโผล่
      setFitScale(
        Math.min(availableWidth / paperWidth, availableHeight / paperHeight) *
          0.98,
      );
      setIsMeasured(true);
    };

    fit();
    // ไดอะล็อกมีอนิเมชันตอนเปิด วัดตั้งแต่เฟรมแรกอาจได้ขนาดระหว่างทาง จึงวัดซ้ำหลังนิ่งแล้ว
    const settle = setTimeout(fit, 200);
    window.addEventListener("resize", fit);
    const observer = new ResizeObserver(fit);
    if (paperRef.current) observer.observe(paperRef.current);
    if (chromeRef.current) observer.observe(chromeRef.current);
    if (zoomBarRef.current) observer.observe(zoomBarRef.current);
    if (actionsRef.current) observer.observe(actionsRef.current);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("resize", fit);
      observer.disconnect();
    };
  }, [open]);

  const scale = fitScale * zoom;
  // กรอบดูตัวอย่างเท่าขนาดแผ่นที่ย่อแล้วพอดี ไม่มีพื้นที่ว่างรอบกระดาษ
  const paperBoxWidth = PAPER_WIDTH_MM * MM * fitScale;
  const paperBoxHeight = PAPER_HEIGHT_MM * MM * fitScale;

  if (!repair) return null;

  const issuedAt = new Date(repair.paidAt || repair.createdAt || Date.now());
  const day = issuedAt.getDate();
  const month = issuedAt.toLocaleDateString("th-TH", { month: "long" });
  // ใบเสร็จไทยเขียนปี พ.ศ. สองหลัก ตามที่เขียนมือในเล่ม
  const year = String(issuedAt.getFullYear() + 543).slice(-2);

  const plate = repair.vehicle?.licensePlate;
  const vehicleName = getDisplayBrand(repair.vehicle?.vehicleModel) || "";
  const plateText = plate?.plateNumber
    ? `${plate.plateNumber} ${plate.province || ""}`.trim()
    : "";

  // หัวใบเขียนชื่อลูกค้า ถ้าไม่มีก็ใช้ยี่ห้อรุ่นรถแทน เหมือนที่เขียนมือในเล่ม
  const customerName = repair.customer?.name || "";
  const customerAddress = repair.customer?.address || "";

  const items = mergeBySide(repair.repairItems || []);
  const blankRows = Math.max(0, MIN_ROWS - items.length);
  const total = Number(repair.totalPrice || 0);

  // พิมพ์ออกเครื่องที่ต่อกับคอมร้าน ใช้ตอนสั่งจากมือถือซึ่งมองไม่เห็นเครื่องพิมพ์นั้น
  const handlePrintAtShop = async () => {
    if (isPrintingAtShop) return;

    try {
      setIsPrintingAtShop(true);
      await withMinDuration(() => printRepairReceipt(repair.id));
      toast.success("ส่งใบเสร็จเข้าเครื่องพิมพ์แล้ว");
    } catch (error) {
      toastError(error, "สั่งพิมพ์ไม่สำเร็จ");
    } finally {
      setIsPrintingAtShop(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          width: paperBoxWidth
            ? paperBoxWidth + VIEWPORT_MARGIN * 2
            : undefined,
        }}
        className="flex max-h-[90svh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden p-0"
        showCloseButton={false}
      >
        <div
          ref={chromeRef}
          className="receipt-chrome relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]"
        >
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            ตัวอย่างใบเสร็จ
          </DialogTitle>
          <DialogDescription className="sr-only">
            ตัวอย่างใบเสร็จก่อนพิมพ์
          </DialogDescription>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div
          id="receipt-viewport"
          style={{
            width: paperBoxWidth || undefined,
            height: paperBoxHeight || undefined,
          }}
          className={`mx-[16px] mb-[16px] ${
            zoom > 1 ? "overflow-auto" : "overflow-hidden"
          } ${isMeasured ? "" : "invisible"}`}
        >
          {/* กระดาษจริง: ตัวนี้คือสิ่งเดียวที่ถูกพิมพ์ (ดูกฎ @media print ใน index.css) */}
          <div
            ref={paperRef}
            id="receipt-paper"
            style={{ transform: `scale(${scale})` }}
            // overflow-hidden เหมือนกระดาษจริงที่พิมพ์เกินขอบไม่ได้
            // ถ้าปล่อยให้ล้น พื้นที่เลื่อนของกรอบดูตัวอย่างจะขยายตามจนเลื่อนได้ทั้งที่ย่อพอดีแล้ว
            className="font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[9.5pt] leading-tight text-black"
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-[8px]">
              <p className="flex items-end gap-[4px] whitespace-nowrap">
                เล่มที่
                <span className="w-[70px] border-b border-dotted border-black" />
              </p>
              <div className="text-center">
                <p className="text-[17px] font-semibold">ใบเสร็จรับเงิน</p>
                <p className="text-[19px] font-semibold">{SHOP.name}</p>
              </div>
              <p className="flex items-end justify-end gap-[4px] whitespace-nowrap">
                เลขที่
                <span className="min-w-[42px] border-b border-dotted border-black text-center font-semibold">
                  {repair.id}
                </span>
              </p>
            </div>

            <p className="mt-[2px] text-center">{SHOP.address}</p>
            <p className="text-center">{SHOP.contact}</p>

            <div className="mt-[8px] flex justify-center gap-[12px]">
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
              <p className="flex items-end gap-[6px]">
                <span className="whitespace-nowrap">ชื่อลูกค้า</span>
                <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
                  {customerName}
                </span>
              </p>
              <p className="flex items-end gap-[6px]">
                <span className="whitespace-nowrap">ที่อยู่</span>
                <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
                  {customerAddress}
                </span>
              </p>
              {/* ช่องนี้มีในเล่มจริง ร้านเว้นว่างไว้เกือบทุกใบ แต่ต้องมีให้กรอกมือได้ */}
              <p className="flex items-end gap-[6px]">
                <span className="whitespace-nowrap">
                  เลขประจำตัวผู้เสียภาษีอากร
                </span>
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

            <table className="mt-[8px] w-full table-fixed border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="w-[62px] border border-black p-[3px] font-semibold">
                    จำนวน
                  </th>
                  <th className="border border-black p-[3px] font-semibold">
                    รายการ
                  </th>
                  <th className="w-[92px] border border-black p-[3px] font-semibold whitespace-nowrap">
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
                        {item.itemName}
                        {sideLabel ? ` (${sideLabel})` : ""}
                      </td>
                      <td className="border border-black px-[4px] text-right">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="border border-black px-[4px] text-right">
                        {formatMoney(amount)}
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
                <tr>
                  <td
                    colSpan={2}
                    className="border border-black px-[4px] py-[5px]"
                  >
                    <span className="mr-[6px]">จำนวนเงินรวมทั้งสิ้น</span>
                    <span className="font-semibold">{bahtText(total)}</span>
                  </td>
                  <td className="border border-black px-[4px] text-center whitespace-nowrap">
                    จำนวนเงินรวม
                  </td>
                  <td className="border border-black px-[4px] text-right font-semibold">
                    {formatMoney(total)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* เล่มกระดาษมีแค่เงินสดกับเช็ค แต่ร้านรับโอนกับบัตรด้วย จึงเพิ่มอีกสองช่อง
                  ติ๊กให้เองตามวิธีที่บันทึกไว้ในบิล */}
            <div className="mt-[8px] flex items-center gap-[20px]">
              {PAYMENT_BOXES.map((box) => (
                <span key={box.label} className="flex items-center gap-[6px]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center border border-black text-[10px] leading-none">
                    {repair.paymentMethod === box.method ? "✓" : ""}
                  </span>
                  {box.label}
                </span>
              ))}
            </div>

            {/* แถวของเช็คในเล่มจริง เว้นว่างไว้ให้เขียนมือเหมือนเดิม */}
            <div className="mt-[6px] flex items-end gap-[6px]">
              <span className="whitespace-nowrap">ธนาคาร</span>
              <span className="w-[110px] border-b border-dotted border-black" />
              <span className="whitespace-nowrap">เลขที่</span>
              <span className="w-[80px] border-b border-dotted border-black" />
              <span className="whitespace-nowrap">ลงวันที่</span>
              <span className="w-[80px] border-b border-dotted border-black" />
              <span className="whitespace-nowrap">จำนวนเงิน</span>
              <span className="flex-1 border-b border-dotted border-black" />
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
          </div>
        </div>

        <div
          ref={zoomBarRef}
          className="receipt-chrome flex flex-shrink-0 items-center justify-center gap-[12px] px-[16px] pb-[8px]"
        >
          <button
            type="button"
            // ปัดทศนิยมกันค่าเพี้ยนสะสมจากการบวกลบทีละ 0.25 แล้วปุ่มดับก่อนถึงขีดสุด
            onClick={() =>
              setZoom((z) =>
                Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100),
              )
            }
            disabled={zoom <= MIN_ZOOM}
            aria-label="ย่อ"
            className="text-subtle-dark flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-subtle-dark min-w-[56px] text-center text-lg font-semibold md:text-xl">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) =>
                Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100),
              )
            }
            disabled={zoom >= MAX_ZOOM}
            aria-label="ขยาย"
            className="text-subtle-dark flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={actionsRef}
          className="receipt-chrome flex-shrink-0 px-[16px] py-[16px]"
        >
          <div className="flex gap-[16px]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold md:text-xl"
            >
              ปิด
            </button>
            <FormButton
              label={
                <div className="flex items-center justify-center gap-[8px]">
                  <Printer className="h-4 w-4" />
                  พิมพ์
                </div>
              }
              isLoading={isPrintingAtShop}
              onClick={handlePrintAtShop}
              className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;
