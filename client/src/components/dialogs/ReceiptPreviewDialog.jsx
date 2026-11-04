import { useLayoutEffect, useRef, useState } from "react";
import usePaperFit, {
  MM,
  PAPER_HEIGHT_MM,
  PAPER_WIDTH_MM,
} from "@/hooks/usePaperFit";
import { X, Printer, Download, LoaderCircle } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import ReceiptPaper from "@/components/receipt/ReceiptPaper";
import {
  asDeliveryNote,
  asIssued,
  canReprintDeliveryNote,
  hasShortenableName,
  jobSheetNo,
  receiptDocNo,
  receiptCopyLabels,
  COPY_CHOICES,
  receiptDocTitle,
  receiptPageCount,
} from "@/utils/receipt";
import JobSheetPaper from "@/components/receipt/JobSheetPaper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { printRepairReceipt, renderRepairImages } from "@/api/repair";
import { isSaleRepair, isNoVehicleRepair } from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

const downloadPng = (base64, fileName) => {
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // ปล่อยให้เบราว์เซอร์เริ่มดาวน์โหลดก่อนค่อยคืนหน่วยความจำ
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// แถบเลื่อนแบบเดียวกับแท็บช่วงล่างและแท็บในหน้ารายงาน ให้ต่างจากแถวเลือกเอกสารด้านบน
// "ต้นฉบับและสำเนา" ยาวกว่าช่องอื่น ช่องจึงกว้างไม่เท่ากัน แถบเลื่อนวัดตำแหน่งจากปุ่มจริง
const CopyChoicePicker = ({ value, onChange }) => {
  const buttonRefs = useRef({});
  const [thumb, setThumb] = useState(null);

  useLayoutEffect(() => {
    const button = buttonRefs.current[value];
    if (button)
      setThumb({ left: button.offsetLeft, width: button.offsetWidth });
  }, [value]);

  return (
    <div
      role="tablist"
      className="relative flex w-full rounded-lg bg-gray-100 p-1"
    >
      {thumb && (
        <div
          aria-hidden="true"
          className="bg-gradient-primary absolute top-1 bottom-1 rounded-lg shadow-lg duration-300 ease-out"
          style={thumb}
        />
      )}
      {COPY_CHOICES.map((choice) => (
        <button
          key={choice.id}
          ref={(node) => {
            buttonRefs.current[choice.id] = node;
          }}
          type="button"
          role="tab"
          aria-selected={value === choice.id}
          onClick={() => onChange(choice.id)}
          className={`font-athiti relative z-10 flex h-10 min-w-0 cursor-pointer items-center justify-center rounded-lg text-lg font-semibold whitespace-nowrap duration-300 ease-out md:text-xl ${
            choice.id === "both" ? "flex-[1.6]" : "flex-1"
          } ${value === choice.id ? "text-white" : "text-subtle-dark"}`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
};

const ReceiptPreviewDialog = ({ repair: rawRepair, open, onOpenChange }) => {
  const repair = asIssued(rawRepair);
  // วาดขนาดจริงของ A5 แล้วสเกลทั้งแผ่นให้พอดีไดอะล็อก ตัวอย่างจึงตรงกับที่พิมพ์
  // ส่วนที่ไม่ใช่กระดาษติดคลาส receipt-chrome ไว้ วัดรวมจากคลาสนั้น
  const viewportRef = useRef(null);
  const [isPrintingAtShop, setIsPrintingAtShop] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [docType, setDocType] = useState("receipt");
  const [copyChoice, setCopyChoice] = useState("both");

  const { contentRef, paperRef, scale, isMeasured } = usePaperFit({
    open,
    chromeEstimate: 180,
    // เปิดใหม่ทุกครั้งกลับไปค่าเริ่มต้น หน่วยงานกับร้านค้าใช้ใบไปเบิกจ่าย จึงแสดงข้อมูลลูกค้าไว้ก่อน
    onOpen: () => {
      setShowCustomer(!!repair?.customer?.organizationType);
      setShowBrand(false);
      setDocType("receipt");
      setCopyChoice("both");
    },
  });

  if (!repair) return null;

  const docRepair = docType === "delivery" ? asDeliveryNote(repair) : repair;
  const pageCount =
    docType === "job" ? 1 : receiptPageCount(docRepair, { showBrand });

  const isCreditBill = docRepair.status === "CREDIT";
  const copyLabels =
    docType === "job" ? [null] : receiptCopyLabels(docRepair, copyChoice);
  const sheets = copyLabels.flatMap((copyLabel) =>
    Array.from({ length: pageCount }, (_, page) => ({ page, copyLabel })),
  );

  const customerName = repair.customer?.name || "";
  const customerAddress = repair.customer?.address || "";
  const hasCustomerInfo = !!(
    customerName ||
    customerAddress ||
    repair.customer?.taxId ||
    repair.customer?.phoneNumber
  );
  // ใบสั่งซ่อมมีเฉพาะงานที่มีรถและกำลังซ่อม ซ่อมเสร็จหรือยกเลิกแล้วช่างไม่ต้องใช้ใบนี้
  const showJobSheetTab =
    !isSaleRepair(repair) &&
    !isNoVehicleRepair(repair) &&
    repair.status === "IN_PROGRESS" &&
    !repair.isCancelled;
  const docTabs = showJobSheetTab
    ? [
        { id: "receipt", label: receiptDocTitle(repair) },
        { id: "job", label: "ใบสั่งซ่อม" },
      ]
    : canReprintDeliveryNote(repair)
      ? [
          { id: "receipt", label: "ใบเสร็จรับเงิน" },
          { id: "delivery", label: "ใบส่งของ" },
        ]
      : [];
  const canShortenNames = hasShortenableName(repair.repairItems || []);

  const handlePrintAtShop = async () => {
    if (isPrintingAtShop) return;

    try {
      setIsPrintingAtShop(true);
      await withMinDuration(() =>
        printRepairReceipt(repair.id, {
          showCustomer,
          showBrand,
          docType,
          copyChoice,
        }),
      );
      onOpenChange(false);
      toast.success(
        docType === "job"
          ? "สั่งพิมพ์ใบสั่งซ่อมแล้ว"
          : `สั่งพิมพ์${receiptDocTitle(docRepair)}แล้ว`,
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

  const handleSaveImage = async () => {
    if (isSavingImage) return;

    try {
      setIsSavingImage(true);
      const res = await withMinDuration(() =>
        renderRepairImages(repair.id, {
          showCustomer,
          showBrand,
          docType,
          copyChoice,
        }),
      );
      const images = res.data?.images || [];
      // ไม่ใช้ภาษาไทยในชื่อไฟล์ เพราะบางระบบอ่านเพี้ยน
      const docNo =
        docType === "job" ? jobSheetNo(repair) : receiptDocNo(docRepair);
      const title =
        docType === "job" ? "ใบสั่งซ่อม" : receiptDocTitle(docRepair);
      const fileBase = docNo === repair.id ? `${title}-${repair.id}` : docNo;

      // บางเบราว์เซอร์บล็อกการดาวน์โหลดหลายไฟล์ที่สั่งพร้อมกัน จึงเว้นจังหวะให้ทีละแผ่น
      for (const [index, image] of images.entries()) {
        // ขีดล่าง ไม่ใช่ขีด เลขเอกสารใช้ขีดคั่นอยู่แล้ว ต่อ -1 จะอ่านเหมือนเลขเอกสารอีกใบ
        const suffix = images.length > 1 ? `_${index + 1}` : "";
        downloadPng(image, `${fileBase}${suffix}.png`);
        if (index < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      toast.success(
        images.length > 1
          ? `บันทึกรูปแล้ว ${images.length} แผ่น`
          : "บันทึกรูปแล้ว",
      );
    } catch (error) {
      toastError(error, "บันทึกรูปไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        // ถ้ากว้างตามกระดาษ ขนาดกระดาษก็คิดจากไดอะล็อกอีกที จะวนกันจนเห็นขยับตอนเปิด
        className={`flex max-h-[90svh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-155 ${
          isMeasured ? "" : "opacity-0"
        }`}
        showCloseButton={false}
        // ไม่งั้น Radix จะโฟกัสปุ่มกากบาทแล้วขึ้นกรอบไฮไลท์ตั้งแต่เปิด
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="receipt-chrome relative mt-4 mb-2 flex min-h-11 flex-shrink-0 items-center justify-center px-16">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            {docType === "job"
              ? "ตัวอย่างใบสั่งซ่อม"
              : `ตัวอย่าง${receiptDocTitle(docRepair)}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            ตัวอย่างใบเสร็จก่อนพิมพ์
          </DialogDescription>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-5 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        {docTabs.length > 0 && (
          <div className="receipt-chrome mx-4 mb-2 flex justify-center gap-2">
            {docTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDocType(tab.id)}
                className={`font-athiti h-9.5 flex-1 cursor-pointer rounded-[20px] border text-lg font-semibold duration-300 md:text-xl ${
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

        {/* บิลที่สลับใบเสร็จกับใบส่งของได้ แถบนี้กาง/ยุบตามเอกสารที่เลือก
            receipt-chrome อยู่ชั้นในสุด ตอนยุบยังวัดได้ความสูงจริง ขนาดกระดาษจึงเผื่อที่ไว้ให้ตอนกาง */}
        {(isCreditBill || canReprintDeliveryNote(repair)) && (
          <div
            inert={!isCreditBill}
            className={`grid transition-all duration-200 motion-reduce:transition-none ${
              isCreditBill
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="receipt-chrome mx-4 pb-2">
                <CopyChoicePicker value={copyChoice} onChange={setCopyChoice} />
              </div>
            </div>
          </div>
        )}

        {/* กันที่ไว้เท่ากันทั้งสองแท็บ สลับแท็บแล้วกล่องจะได้ไม่เปลี่ยนความสูง */}
        {(hasCustomerInfo || canShortenNames) && (
          <div
            className={`receipt-chrome mx-4 mb-2 flex flex-wrap justify-center gap-x-5 gap-y-1 ${
              docType === "job" ? "invisible" : ""
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
                  className="font-athiti flex cursor-pointer items-center gap-2"
                >
                  <span
                    className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 ${
                      item.value ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`bg-surface h-4 w-4 rounded-full transition-transform duration-300 ${
                        item.value ? "translate-x-4" : "translate-x-0"
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
          // scrollbar-gutter คงที่ ไม่งั้นแถบเลื่อนโผล่แล้วความกว้างเปลี่ยน วัดขนาดใหม่วนไปมา
          style={{ height: PAPER_HEIGHT_MM * MM * scale }}
          className="mx-5 mb-2 min-h-0 shrink overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
        >
          {/* การสเกลไม่เปลี่ยนขนาดในการจัดหน้า กรอบจึงต้องเท่าขนาดหลังย่อ */}
          <div className="flex flex-col items-center gap-3">
            {sheets.map(({ page, copyLabel }, sheetIndex) => (
              <div
                key={`${copyLabel}-${page}`}
                style={{
                  width: PAPER_WIDTH_MM * MM * scale,
                  height: PAPER_HEIGHT_MM * MM * scale,
                }}
                className="shrink-0"
              >
                {/* ตัวนี้คือสิ่งเดียวที่ถูกพิมพ์ (ดู @media print ใน index.css) */}
                <div
                  ref={sheetIndex === 0 ? paperRef : undefined}
                  className={`receipt-paper font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[11pt] leading-tight text-black ${
                    // ขอบล่าง 4 มม. เอาที่ให้ QR (ตรงกับ .receipt-fill ฝั่งเซิร์ฟเวอร์)
                    docType === "job" ? "" : "flex flex-col pb-[4mm]"
                  }`}
                  style={{ transform: `scale(${scale})` }}
                >
                  {docType === "job" ? (
                    <JobSheetPaper repair={repair} />
                  ) : (
                    <ReceiptPaper
                      repair={docRepair}
                      showCustomer={showCustomer}
                      showBrand={showBrand}
                      pageIndex={page}
                      copyLabel={copyLabel}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="receipt-chrome flex-shrink-0 px-5 pt-2 pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={isSavingImage}
              className="font-athiti bg-surface text-primary border-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[20px] border text-lg font-semibold whitespace-nowrap duration-300 disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
            >
              {isSavingImage ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              บันทึกรูป
            </button>
            <FormButton
              label={
                <div className="flex items-center justify-center gap-2">
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
