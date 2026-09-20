import { useLayoutEffect, useRef, useState } from "react";
import { X, Printer } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import ReceiptPaper, {
  receiptPageCount,
} from "@/components/receipt/ReceiptPaper";
import CreditSummaryPaper from "@/components/receipt/CreditSummaryPaper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { printOrganizationBill } from "@/api/customer";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

// ขนาดกระดาษ A5 เต็มแผ่น ขอบพิมพ์เว้นเองข้างใน (ดูกฎ @media print)
const PAPER_WIDTH_MM = 148;
const PAPER_HEIGHT_MM = 210;
const MM = 96 / 25.4;

const VIEWPORT_MARGIN = 16;
const DIALOG_MAX_WIDTH = 620;
const DIALOG_MAX_HEIGHT_RATIO = 0.88;
const ESTIMATED_CHROME_HEIGHT = 140;

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

// ตัวอย่างใบวางบิล: แผ่นแรกเป็นใบสรุปยอดค้าง แผ่นถัดไปเป็นใบเสร็จของแต่ละบิล
// วิธีวัดและย่อกระดาษเหมือนตัวอย่างใบเสร็จทุกอย่าง ต่างแค่จำนวนแผ่นมาจากหลายบิล
const OrganizationBillPreviewDialog = ({
  customer,
  repairs,
  // พิมพ์ของเดือนไหน (เช่น 2026-09) ไม่ส่งมา = บิลที่ยังค้างชำระทั้งหมด
  month,
  open,
  onOpenChange,
}) => {
  const contentRef = useRef(null);
  const paperRef = useRef(null);
  const [fitScale, setFitScale] = useState(estimateFitScale);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setIsMeasured(false);
    setFitScale(estimateFitScale());

    const fit = () => {
      const paper = paperRef.current;
      const paperWidth = paper?.offsetWidth;
      const paperHeight = paper?.offsetHeight;

      if (!paperWidth || !paperHeight) {
        setIsMeasured(true);
        return;
      }

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
        setFitScale(
          Math.min(availableWidth / paperWidth, availableHeight / paperHeight) *
            0.99,
        );
      }
    };

    fit();
    const reveal = requestAnimationFrame(() => {
      fit();
      setIsMeasured(true);
    });

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

  if (!customer || !repairs?.length) return null;

  // เรียงตามเลขที่ใบเสร็จจากน้อยไปมาก ให้ตรงกับใบที่พิมพ์ออกมาจริง
  // (หน้าที่เรียกใช้เรียงใหม่สุดขึ้นก่อน ซึ่งเหมาะกับการอ่านบนจอ แต่คนละเรื่องกับบนกระดาษ)
  const ordered = [...repairs].sort((a, b) => a.id - b.id);

  // ใบสรุปหนึ่งแผ่น แล้วตามด้วยแผ่นของแต่ละบิล (บิลยาวเกินหนึ่งแผ่นก็แตกเป็นหลายแผ่น)
  const sheets = [
    { key: "summary", type: "summary" },
    ...ordered.flatMap((repair) =>
      Array.from({ length: receiptPageCount(repair) }).map((_, page) => ({
        key: `${repair.id}-${page}`,
        type: "receipt",
        repair,
        pageIndex: page,
      })),
    ),
  ];

  const handlePrint = async () => {
    if (isPrinting) return;

    try {
      setIsPrinting(true);
      const res = await withMinDuration(() =>
        printOrganizationBill(customer.id, month),
      );
      toast.success(res.data?.message || "ส่งใบวางบิลเข้าเครื่องพิมพ์แล้ว");
    } catch (error) {
      toastError(
        error,
        "พิมพ์ไม่ได้ กรุณาตรวจสอบเครื่องพิมพ์แล้วลองใหม่อีกครั้ง",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className={`flex max-h-[92svh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden p-0 sm:max-w-[620px] ${
          isMeasured ? "" : "opacity-0"
        }`}
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="receipt-chrome relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            ตัวอย่างใบวางบิล
          </DialogTitle>
          <DialogDescription className="sr-only">
            ใบวางบิลและใบเสร็จของแต่ละบิล
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div
          style={{ height: PAPER_HEIGHT_MM * MM * fitScale }}
          className="mx-[16px] mb-[8px] min-h-0 shrink overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
        >
          <div className="flex flex-col items-center gap-[12px]">
            {sheets.map((sheet, index) => (
              <div
                key={sheet.key}
                style={{
                  width: PAPER_WIDTH_MM * MM * scale,
                  height: PAPER_HEIGHT_MM * MM * scale,
                }}
                className="shrink-0"
              >
                <div
                  ref={index === 0 ? paperRef : undefined}
                  className="receipt-paper font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[11pt] leading-tight text-black"
                  style={{ transform: `scale(${scale})` }}
                >
                  {sheet.type === "summary" ? (
                    <CreditSummaryPaper customer={customer} repairs={ordered} />
                  ) : (
                    <ReceiptPaper
                      repair={sheet.repair}
                      showCustomer
                      showBrand={false}
                      pageIndex={sheet.pageIndex}
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
              isLoading={isPrinting}
              onClick={handlePrint}
              className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationBillPreviewDialog;
