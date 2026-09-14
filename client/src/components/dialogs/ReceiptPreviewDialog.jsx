import { useLayoutEffect, useRef, useState } from "react";
import { X, Printer, Plus, Minus } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import ReceiptPaper, {
  hasShortenableName,
} from "@/components/receipt/ReceiptPaper";
import JobSheetPaper from "@/components/receipt/JobSheetPaper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { printRepairReceipt } from "@/api/repair";
import { isSaleRepair, isNoVehicleRepair } from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

// ขนาดกระดาษ A5 เต็มแผ่น ขอบพิมพ์เว้นเองข้างใน (ดูกฎ @media print)
const PAPER_WIDTH_MM = 148;
const PAPER_HEIGHT_MM = 210;
// 1 มิลลิเมตร = 96/25.4 พิกเซลตามมาตรฐาน CSS ใช้คำนวณขนาดกรอบหลังย่อ
const MM = 96 / 25.4;

// ระยะห่างรอบกรอบดูตัวอย่าง ต้องตรงกับคลาสที่ใช้จริง
const VIEWPORT_MARGIN = 16;
// เพดานขนาดไดอะล็อก ต้องตรงกับคลาสที่ใช้จริงเช่นกัน
const DIALOG_MAX_WIDTH = 620;
const DIALOG_MAX_HEIGHT_RATIO = 0.9;
// ความสูงโดยประมาณของหัวข้อ แถบซูม และแถวปุ่มรวมกัน ใช้เดาขนาดตั้งแต่เรนเดอร์แรก
// ก่อนจะวัดของจริงได้ ค่าคลาดนิดหน่อยไม่เป็นไรเพราะซ่อนไว้จนกว่าจะวัดเสร็จ
const ESTIMATED_CHROME_HEIGHT = 180;

// ขนาดที่พอดีกรอบโดยประมาณ คิดจากขนาดจอล้วน ไม่ต้องรออ่านค่าจากหน้าจอจริง
const estimateFitScale = () => {
  if (typeof window === "undefined") return 1;

  const maxDialogWidth = Math.min(DIALOG_MAX_WIDTH, window.innerWidth - 32);
  const availableWidth = maxDialogWidth - VIEWPORT_MARGIN * 2;
  const availableHeight =
    window.innerHeight * DIALOG_MAX_HEIGHT_RATIO -
    ESTIMATED_CHROME_HEIGHT -
    VIEWPORT_MARGIN * 2;

  return (
    Math.min(
      availableWidth / (PAPER_WIDTH_MM * MM),
      availableHeight / (PAPER_HEIGHT_MM * MM),
    ) * 0.98
  );
};

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2;

const ReceiptPreviewDialog = ({ repair, open, onOpenChange }) => {
  // ตัวอย่างบนจอกับใบที่พิมพ์ต้องเป็นกระดาษแผ่นเดียวกันเป๊ะ
  // จึงวาดด้วยขนาดจริงของ A5 (หักขอบกระดาษแล้ว) แล้วย่อทั้งแผ่นให้พอดีความกว้างไดอะล็อก
  // ย่อด้วยการสเกล ไม่ใช่ปรับขนาดตัวอักษร สัดส่วนทุกอย่างจึงเท่าของจริง
  // สามส่วนที่ไม่ใช่กระดาษ ใช้วัดว่าเหลือที่ให้กระดาษเท่าไหร่
  const viewportRef = useRef(null);
  const chromeRef = useRef(null);
  const zoomBarRef = useRef(null);
  const actionsRef = useRef(null);
  const paperRef = useRef(null);
  // ขนาดที่ทำให้ทั้งแผ่นพอดีกรอบ คิดจากทั้งกว้างและสูง จะได้เห็นครบโดยไม่ต้องเลื่อน
  const [fitScale, setFitScale] = useState(estimateFitScale);
  // ตัวคูณจากการซูมของผู้ใช้ 1 เท่ากับพอดีกรอบ
  const [zoom, setZoom] = useState(1);
  const [isPrintingAtShop, setIsPrintingAtShop] = useState(false);
  // ลูกค้าบางรายไม่อยากให้ชื่อกับที่อยู่ขึ้นบนใบ ปิดได้ก่อนสั่งพิมพ์
  const [showCustomer, setShowCustomer] = useState(true);
  // ชื่อในบิลมียี่ห้อกับรุ่นรถต่อท้ายจนยาว ใบเสร็จจึงตัดเหลือแค่ชนิดอะไหล่ไว้ก่อน
  // เปิดสวิตช์เมื่อลูกค้าอยากรู้ว่าใส่ของยี่ห้อไหนรุ่นอะไร
  const [showBrand, setShowBrand] = useState(false);
  // ใบเสร็จให้ลูกค้า กับใบสั่งซ่อมให้ช่าง ใช้กระดาษกับปุ่มพิมพ์ชุดเดียวกัน
  const [docType, setDocType] = useState("receipt");
  // เฟรมแรกกระดาษยังเป็นขนาดจริง ต้องรอวัดพื้นที่เสร็จก่อนถึงจะโชว์
  // ไม่งั้นจะเห็นแผ่นใหญ่วูบหนึ่งครั้งแล้วหดลงมา
  const [isMeasured, setIsMeasured] = useState(false);

  // useLayoutEffect เพราะต้องวัดและย่อให้เสร็จก่อนจอวาดเฟรมแรก
  // ถ้าวัดหลังวาด จะเห็นกล่องไดอะล็อกกางออกแล้วหดเข้ามาหนึ่งครั้ง
  useLayoutEffect(() => {
    if (!open) return;
    setZoom(1);
    setIsMeasured(false);
    setShowCustomer(true);
    setShowBrand(false);
    setDocType("receipt");
    setFitScale(estimateFitScale());

    const fit = () => {
      const chrome = chromeRef.current;
      const paper = paperRef.current;
      const paperWidth = paper?.offsetWidth;
      const paperHeight = paper?.offsetHeight;

      // วัดไม่ได้ (ยังไม่ถูกวางลงหน้า) ก็ใช้ค่าประมาณจากขนาดจอไปก่อน
      // สำคัญคือต้องปลดการซ่อนทุกกรณี ไม่งั้นกล่องจะถูกซ่อนค้างจนดูเหมือนเปิดช้า
      if (!paperWidth || !paperHeight) {
        setIsMeasured(true);
        return;
      }

      // คิดจากพื้นที่ว่างบนจอโดยตรง ไม่ใช่จากขนาดไดอะล็อก
      // เพราะไดอะล็อกจะหดตามกระดาษ ถ้าวัดจากมันจะกลายเป็นวนกันเอง
      const maxDialogWidth = Math.min(DIALOG_MAX_WIDTH, window.innerWidth - 32);
      const availableWidth = maxDialogWidth - VIEWPORT_MARGIN * 2;
      const chromeHeight =
        (chrome?.offsetHeight || 0) +
          (zoomBarRef.current?.offsetHeight || 0) +
          (actionsRef.current?.offsetHeight || 0) || ESTIMATED_CHROME_HEIGHT;
      const availableHeight =
        window.innerHeight * DIALOG_MAX_HEIGHT_RATIO -
        chromeHeight -
        VIEWPORT_MARGIN * 2;

      if (availableWidth > 0 && availableHeight > 0) {
        // เผื่อไว้เล็กน้อย กันเศษปัดของเบราว์เซอร์ทำให้ล้นออกไปหนึ่งจุดแล้วมีแถบเลื่อนโผล่
        setFitScale(
          Math.min(availableWidth / paperWidth, availableHeight / paperHeight) *
            0.98,
        );
      }

      setIsMeasured(true);
    };

    fit();
    // ไดอะล็อกมีอนิเมชันตอนเปิด วัดตั้งแต่เฟรมแรกอาจได้ขนาดระหว่างทาง จึงวัดซ้ำหลังนิ่งแล้ว
    const settle = setTimeout(fit, 120);
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

  // กลับมาขนาดพอดีกรอบแล้วกรอบจะเลื่อนไม่ได้อีก ต้องดึงกลับขึ้นบนสุดก่อน
  // ไม่งั้นกระดาษจะค้างอยู่ตรงตำแหน่งที่เลื่อนไว้ตอนซูม แล้วเลื่อนกลับไม่ได้
  useLayoutEffect(() => {
    if (zoom !== 1 || !viewportRef.current) return;
    viewportRef.current.scrollTop = 0;
    viewportRef.current.scrollLeft = 0;
  }, [zoom]);

  const scale = fitScale * zoom;
  // กรอบดูตัวอย่างเท่าขนาดแผ่นที่ย่อแล้วพอดี ไม่มีพื้นที่ว่างรอบกระดาษ
  const paperBoxWidth = PAPER_WIDTH_MM * MM * fitScale;
  const paperBoxHeight = PAPER_HEIGHT_MM * MM * fitScale;

  if (!repair) return null;

  const customerName = repair.customer?.name || "";
  const customerAddress = repair.customer?.address || "";
  // บิลที่ไม่มีทั้งชื่อและที่อยู่ ปิดสวิตช์ไปก็ไม่มีอะไรหาย จึงไม่ต้องมีสวิตช์ให้กด
  const hasCustomerInfo = !!(customerName || customerAddress);
  // ใบสั่งซ่อมมีไว้ส่งงานให้ช่างที่ทำกับรถ ใช้กับงานซ่อมทั่วไปและงานเช็กช่วงล่าง
  // งานบริการที่ไม่ผูกรถกับบิลขายอะไหล่หน้าร้านจบที่หน้าร้าน ไม่มีงานให้ส่งต่อ
  const showJobSheetTab = !isSaleRepair(repair) && !isNoVehicleRepair(repair);
  // มีสวิตช์ชื่อแบบเต็มให้กดเฉพาะบิลที่มีของซึ่งย่อชื่อได้จริง (ช่วงล่างกับน้ำมัน)
  const canShortenNames = hasShortenableName(repair.repairItems || []);

  const handlePrintAtShop = async () => {
    if (isPrintingAtShop) return;

    try {
      setIsPrintingAtShop(true);
      await withMinDuration(() =>
        printRepairReceipt(repair.id, { showCustomer, showBrand, docType }),
      );
      toast.success(
        docType === "job" ? "สั่งพิมพ์ใบสั่งซ่อมแล้ว" : "สั่งพิมพ์ใบเสร็จแล้ว",
      );
    } catch (error) {
      toastError(
        error,
        "พิมพ์ไม่ได้ กรุณาตรวจสอบเครื่องพิมพ์แล้วลองใหม่อีกครั้ง",
      );
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
        className={`flex max-h-[90svh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden p-0 ${
          isMeasured ? "" : "opacity-0"
        }`}
        showCloseButton={false}
        // ไม่มีอะไรให้กรอกในหน้านี้ ไม่ต้องโฟกัสปุ่มไหน
        // ปล่อยไว้ Radix จะไปโฟกัสปุ่มกากบาทให้เอง แล้วขึ้นกรอบไฮไลท์ตั้งแต่เปิด
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          ref={chromeRef}
          className="receipt-chrome relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]"
        >
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            {docType === "job" ? "ตัวอย่างใบสั่งซ่อม" : "ตัวอย่างใบเสร็จ"}
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

        {/* เลือกว่าจะพิมพ์ใบไหน ตัวอย่างข้างล่างเปลี่ยนตามทันที */}
        {showJobSheetTab && (
          <div className="receipt-chrome mx-[16px] mb-[8px] flex justify-center gap-[8px]">
            {[
              { id: "receipt", label: "ใบเสร็จ" },
              { id: "job", label: "ใบสั่งซ่อม" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                // สลับใบแล้วเริ่มดูใบใหม่ที่ขนาดพอดีกรอบเสมอ ไม่ค้างซูมของใบก่อน
                onClick={() => {
                  setDocType(tab.id);
                  setZoom(1);
                }}
                className={`font-athiti h-[38px] flex-1 cursor-pointer rounded-[20px] border text-lg font-semibold duration-300 md:text-xl ${
                  docType === tab.id
                    ? "bg-primary text-surface border-transparent"
                    : "border-subtle-light text-subtle-dark bg-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ตั้งค่าก่อนแล้วเห็นผลบนกระดาษข้างล่างทันที จึงอยู่เหนือกระดาษ */}
        {docType === "receipt" && (
          <div className="receipt-chrome mx-[16px] mb-[8px] flex flex-wrap justify-center gap-x-[20px] gap-y-[4px]">
            {[
              {
                label: "แสดงข้อมูลลูกค้า",
                value: showCustomer,
                onToggle: () => setShowCustomer((value) => !value),
                visible: hasCustomerInfo,
              },
              {
                label: "แสดงชื่ออะไหล่แบบเต็ม",
                value: showBrand,
                onToggle: () => setShowBrand((value) => !value),
                visible: canShortenNames,
              },
            ]
              .filter((item) => item.visible)
              .map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onToggle}
                  aria-pressed={item.value}
                  className="font-athiti flex cursor-pointer items-center gap-[8px]"
                >
                  <span
                    className={`flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] duration-300 ${
                      item.value ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`bg-surface h-[16px] w-[16px] rounded-full duration-300 ${
                        item.value ? "translate-x-[16px]" : "translate-x-0"
                      }`}
                    />
                  </span>
                  <span
                    className={`text-lg font-medium md:text-xl ${
                      item.value ? "text-primary" : "text-subtle-dark"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
          </div>
        )}

        <div
          ref={viewportRef}
          id="receipt-viewport"
          style={{
            width: paperBoxWidth || undefined,
            height: paperBoxHeight || undefined,
          }}
          className={`mx-[16px] mb-[16px] ${
            zoom > 1 ? "overflow-auto" : "overflow-hidden"
          }`}
        >
          {/* กระดาษจริง: ตัวนี้คือสิ่งเดียวที่ถูกพิมพ์ (ดูกฎ @media print ใน index.css) */}
          <div
            ref={paperRef}
            id="receipt-paper"
            style={{ transform: `scale(${scale})` }}
            // overflow-hidden เหมือนกระดาษจริงที่พิมพ์เกินขอบไม่ได้
            // ถ้าปล่อยให้ล้น พื้นที่เลื่อนของกรอบดูตัวอย่างจะขยายตามจนเลื่อนได้ทั้งที่ย่อพอดีแล้ว
            className="font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[11pt] leading-tight text-black"
          >
            {docType === "job" ? (
              <JobSheetPaper repair={repair} />
            ) : (
              <ReceiptPaper
                repair={repair}
                showCustomer={showCustomer}
                showBrand={showBrand}
              />
            )}
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
