import { useLayoutEffect, useRef, useState } from "react";
import { X, Printer } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import ReceiptPaper, {
  hasShortenableName,
  receiptPageCount,
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
// เว้นที่ไว้จากขอบจอพอสมควร ไม่ให้กล่องไปชนเพดานความสูง
// ไม่งั้นแถบที่อยู่ของเบราว์เซอร์มือถือยุบ/กางทีเดียว ความสูงกล่องก็เปลี่ยนแล้วเลื่อนให้เห็น
const DIALOG_MAX_HEIGHT_RATIO = 0.88;
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

const ReceiptPreviewDialog = ({ repair, open, onOpenChange }) => {
  // ตัวอย่างบนจอกับใบที่พิมพ์ต้องเป็นกระดาษแผ่นเดียวกันเป๊ะ
  // จึงวาดด้วยขนาดจริงของ A5 (หักขอบกระดาษแล้ว) แล้วย่อทั้งแผ่นให้พอดีความกว้างไดอะล็อก
  // ย่อด้วยการสเกล ไม่ใช่ปรับขนาดตัวอักษร สัดส่วนทุกอย่างจึงเท่าของจริง
  // ทุกส่วนที่ไม่ใช่กระดาษ (หัวข้อ แท็บ สวิตช์ แถวปุ่ม) ติดคลาส receipt-chrome ไว้
  // วัดรวมจากคลาสนั้นทีเดียว เพิ่มแถวใหม่ทีหลังก็ถูกนับเองโดยไม่ต้องแก้ตรงนี้
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const paperRef = useRef(null);
  // ขนาดที่ทำให้ทั้งแผ่นพอดีกรอบ คิดจากทั้งกว้างและสูง จะได้เห็นครบโดยไม่ต้องเลื่อน
  const [fitScale, setFitScale] = useState(estimateFitScale);
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
    setIsMeasured(false);
    setShowCustomer(true);
    setShowBrand(false);
    setDocType("receipt");
    setFitScale(estimateFitScale());

    const fit = () => {
      const paper = paperRef.current;
      const paperWidth = paper?.offsetWidth;
      const paperHeight = paper?.offsetHeight;

      // วัดไม่ได้ก็ต้องปลดการซ่อน ไม่งั้นกล่องจะถูกซ่อนค้างจนดูเหมือนเปิดไม่ขึ้น
      if (!paperWidth || !paperHeight) {
        setIsMeasured(true);
        return;
      }

      // ความสูงของแถวที่ไม่ใช่กระดาษวัดได้ตรงๆ และไม่ขึ้นกับขนาดกระดาษ
      // จึงคิดที่ว่างจากขนาดจอลบแถวพวกนี้ ไม่ใช่วัดจากกรอบซึ่งจะกลายเป็นวนกันเอง
      const chromeParts =
        contentRef.current?.querySelectorAll(".receipt-chrome") || [];
      const chromeHeight =
        [...chromeParts].reduce((sum, part) => sum + part.offsetHeight, 0) ||
        ESTIMATED_CHROME_HEIGHT;

      const maxDialogWidth = Math.min(DIALOG_MAX_WIDTH, window.innerWidth - 32);
      const availableWidth = maxDialogWidth - VIEWPORT_MARGIN * 2;
      const availableHeight =
        window.innerHeight * DIALOG_MAX_HEIGHT_RATIO -
        chromeHeight -
        VIEWPORT_MARGIN;

      if (availableWidth > 0 && availableHeight > 0) {
        // เผื่อไว้เล็กน้อย กันเศษปัดของเบราว์เซอร์ทำให้ล้นออกไปหนึ่งจุด
        setFitScale(
          Math.min(availableWidth / paperWidth, availableHeight / paperHeight) *
            0.99,
        );
      }
    };

    // วัดรอบแรกตั้งแต่ยังซ่อนอยู่ แล้ววัดซ้ำในเฟรมถัดไปตอนที่หน้าจัดเสร็จจริง
    // ค่อยแสดงเมื่อได้ค่าที่นิ่งแล้ว ไม่งั้นจะเห็นกระดาษใหญ่แล้วหดลงตอนเปิด
    // ไม่วัดซ้ำหลังจากนั้น เพราะกล่องลอยกลางจอ ความสูงขยับนิดเดียวก็เห็นกล่องเลื่อน
    fit();
    const reveal = requestAnimationFrame(() => {
      fit();
      setIsMeasured(true);
    });

    // วัดใหม่เฉพาะตอนขนาดจอเปลี่ยนจริงจัง เช่นหมุนจอ
    // บนมือถือแถบที่อยู่ของเบราว์เซอร์ยุบ/กางเองได้ ความสูงขยับทีละไม่กี่สิบจุด
    // ถ้าวัดใหม่ทุกครั้งกล่องที่ลอยกลางจอจะเลื่อนให้เห็นทุกที
    let lastSize = { width: window.innerWidth, height: window.innerHeight };
    const onResize = () => {
      const size = { width: window.innerWidth, height: window.innerHeight };
      const changedALot =
        size.width !== lastSize.width ||
        Math.abs(size.height - lastSize.height) > 120;

      if (!changedALot) return;
      lastSize = size;
      fit();
    };

    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(reveal);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const scale = fitScale;

  if (!repair) return null;

  // ใบเสร็จยาวเกินหนึ่งแผ่นจะถูกแยกเป็นหลายใบ ใบสั่งซ่อมยังเป็นแผ่นเดียวเสมอ
  // (คำนวณหลังเช็กว่ามีบิลแล้ว หน้าที่ยังโหลดไม่เสร็จจะส่งค่าว่างมา)
  const pageCount = docType === "job" ? 1 : receiptPageCount(repair);

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
        ref={contentRef}
        // ความกว้างคงที่แบบไดอะล็อกอื่น ไม่หดตามกระดาษ
        // ถ้าให้กว้างตามกระดาษ ขนาดกระดาษก็คิดจากไดอะล็อกอีกที กลายเป็นวนกันเองจนเห็นขยับตอนเปิด
        // สูงตามเนื้อหาเหมือนไดอะล็อกอื่น ไม่ล็อกความสูงไว้
        // ยึดระยะจากขอบบนแทนการจัดกึ่งกลางแนวตั้ง เพราะกล่องสูงเกือบเต็มจอ
        // ถ้าจัดกึ่งกลาง พอแถบที่อยู่ของเบราว์เซอร์มือถือยุบ/กาง จุดกึ่งกลางจะขยับแล้วกล่องเลื่อนตาม
        className={`top-[4svh] flex max-h-[92svh] w-full max-w-[calc(100%-2rem)] translate-y-0 flex-col overflow-hidden p-0 sm:max-w-[620px] ${
          isMeasured ? "" : "opacity-0"
        }`}
        showCloseButton={false}
        // ไม่มีอะไรให้กรอกในหน้านี้ ไม่ต้องโฟกัสปุ่มไหน
        // ปล่อยไว้ Radix จะไปโฟกัสปุ่มกากบาทให้เอง แล้วขึ้นกรอบไฮไลท์ตั้งแต่เปิด
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="receipt-chrome relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
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
                onClick={() => setDocType(tab.id)}
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
        {/* กันที่ไว้เท่าเดิมทั้งสองแท็บ สลับแท็บแล้วกล่องจะได้ไม่เปลี่ยนความสูง
            อยู่ใบสั่งซ่อมจะเว้นว่างไว้ กดไม่ได้และมองไม่เห็น */}
        {(hasCustomerInfo || canShortenNames) && (
          <div
            className={`receipt-chrome mx-[16px] mb-[8px] flex flex-wrap justify-center gap-x-[20px] gap-y-[4px] ${
              docType === "receipt" ? "" : "invisible"
            }`}
          >
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
                    className={`flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 ${
                      item.value ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`bg-surface h-[16px] w-[16px] rounded-full transition-transform duration-300 ${
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
          // เลื่อนบนล่างได้เสมอ เผื่อความสูงจอจริงไม่ตรงกับที่คำนวณไว้
          // ซ้ายขวาเปิดเฉพาะตอนซูม เพราะขนาดพอดีกรอบไม่มีอะไรให้เลื่อนออกข้าง
          // ไม่มีระยะขอบใน พื้นที่เลื่อนจะได้จบที่ขอบกระดาษพอดี ไม่มีที่ว่างเกินท้าย
          // เลื่อนได้เฉพาะแนวตั้ง (บิลหลายแผ่น) กว้างพอดีอยู่แล้วจึงไม่ต้องเลื่อนข้าง
          // scrollbar-gutter คงที่ ไม่งั้นแถบเลื่อนโผล่แล้วความกว้างเปลี่ยน แล้ววัดขนาดใหม่ไปมา
          style={{ height: PAPER_HEIGHT_MM * MM * fitScale }}
          className="mx-[16px] mb-[8px] min-h-0 shrink overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
        >
          {/* กรอบเท่าขนาดแผ่นหลังย่อ กันไม่ให้พื้นที่เลื่อนยาวเท่าขนาดกระดาษจริง
              เพราะการย่อเป็นการแปลงภาพ ขนาดในการจัดหน้ายังเท่าเดิม */}
          <div className="flex flex-col items-center gap-[12px]">
            {Array.from({ length: pageCount }).map((_, page) => (
              <div
                key={page}
                style={{
                  width: PAPER_WIDTH_MM * MM * scale,
                  height: PAPER_HEIGHT_MM * MM * scale,
                }}
                className="shrink-0"
              >
                {/* กระดาษจริง: ตัวนี้คือสิ่งเดียวที่ถูกพิมพ์ (ดูกฎ @media print ใน index.css) */}
                <div
                  ref={page === 0 ? paperRef : undefined}
                  className="receipt-paper font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[11pt] leading-tight text-black"
                  style={{ transform: `scale(${scale})` }}
                >
                  {docType === "job" ? (
                    <JobSheetPaper repair={repair} />
                  ) : (
                    <ReceiptPaper
                      repair={repair}
                      showCustomer={showCustomer}
                      showBrand={showBrand}
                      pageIndex={page}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="receipt-chrome flex-shrink-0 px-[16px] pt-[8px] pb-[16px]">
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
