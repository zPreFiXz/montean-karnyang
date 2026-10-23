import { useEffect, useState } from "react";
import usePaperFit, {
  MM,
  PAPER_HEIGHT_MM,
  PAPER_WIDTH_MM,
} from "@/hooks/usePaperFit";
import { X, Printer } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import CreditSummaryPaper from "@/components/receipt/CreditSummaryPaper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { peekOrganizationBillNo, printOrganizationBill } from "@/api/customer";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

// ตัวอย่างใบวางบิล แผ่นเดียวจบ
// วิธีวัดและย่อกระดาษเหมือนตัวอย่างใบเสร็จทุกอย่าง
const OrganizationBillPreviewDialog = ({
  customer,
  repairs,
  // พิมพ์ของเดือนไหน (เช่น 2026-09) ไม่ส่งมา = บิลที่ยังค้างชำระทั้งหมด
  month,
  open,
  onOpenChange,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [billingNo, setBillingNo] = useState("");

  // ถามเลขทุกครั้งที่เปิด ชุดบิลอาจเปลี่ยนไปจากรอบก่อนแล้ว ถามไม่ได้ก็เว้นช่องว่างไว้ ตอนพิมพ์ยังได้เลขครบ
  useEffect(() => {
    if (!open || !customer?.id) return;
    let isCurrent = true;
    setBillingNo("");
    peekOrganizationBillNo(customer.id, month)
      .then((res) => isCurrent && setBillingNo(res.data?.number || ""))
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [open, customer?.id, month]);

  const { contentRef, paperRef, scale, isMeasured } = usePaperFit({
    open,
    chromeEstimate: 140,
  });

  if (!customer || !repairs?.length) return null;

  // เรียงตามลำดับที่เปิดบิล ให้ตรงกับใบที่พิมพ์ออกมาจริง
  // (หน้าที่เรียกใช้เรียงใหม่สุดขึ้นก่อน ซึ่งเหมาะกับการอ่านบนจอ แต่คนละเรื่องกับบนกระดาษ)
  const ordered = [...repairs].sort((a, b) => a.id - b.id);

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
            สรุปบิลที่ค้างชำระของลูกค้ารายนี้
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
          style={{ height: PAPER_HEIGHT_MM * MM * scale }}
          className="mx-[16px] mb-[8px] min-h-0 shrink overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
        >
          <div className="flex flex-col items-center gap-[12px]">
            <div
              style={{
                width: PAPER_WIDTH_MM * MM * scale,
                height: PAPER_HEIGHT_MM * MM * scale,
              }}
              className="shrink-0"
            >
              <div
                ref={paperRef}
                className="receipt-paper font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[11pt] leading-tight text-black"
                style={{ transform: `scale(${scale})` }}
              >
                <CreditSummaryPaper
                  customer={customer}
                  repairs={ordered}
                  billingNo={billingNo}
                />
              </div>
            </div>
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
