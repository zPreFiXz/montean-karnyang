import { useRef, useState } from "react";
import usePaperFit, {
  MM,
  PAPER_HEIGHT_MM,
  PAPER_WIDTH_MM,
} from "@/hooks/usePaperFit";
import { X, Printer, Download, LoaderCircle } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import ReceiptPaper from "@/components/receipt/ReceiptPaper";
import {
  asIssued,
  hasShortenableName,
  jobSheetNo,
  receiptDocNo,
  receiptCopyLabels,
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

// ไฟล์รูปจากเซิร์ฟเวอร์เป็นข้อความ base64 แปลงเป็นไฟล์แล้วสั่งดาวน์โหลดทีละแผ่น
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

const ReceiptPreviewDialog = ({ repair: rawRepair, open, onOpenChange }) => {
  // บิลที่ยกเลิกแสดงเป็นใบเดิมพร้อมคำว่ายกเลิก ตรงกับใบที่เซิร์ฟเวอร์พิมพ์
  const repair = asIssued(rawRepair);
  // ตัวอย่างบนจอกับใบที่พิมพ์ต้องเป็นกระดาษแผ่นเดียวกันเป๊ะ
  // จึงวาดด้วยขนาดจริงของ A5 (หักขอบกระดาษแล้ว) แล้วย่อทั้งแผ่นให้พอดีความกว้างไดอะล็อก
  // ย่อด้วยการสเกล ไม่ใช่ปรับขนาดตัวอักษร สัดส่วนทุกอย่างจึงเท่าของจริง
  // ทุกส่วนที่ไม่ใช่กระดาษ (หัวข้อ แท็บ สวิตช์ แถวปุ่ม) ติดคลาส receipt-chrome ไว้
  // วัดรวมจากคลาสนั้นทีเดียว เพิ่มแถวใหม่ทีหลังก็ถูกนับเองโดยไม่ต้องแก้ตรงนี้
  const viewportRef = useRef(null);
  const [isPrintingAtShop, setIsPrintingAtShop] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  // ลูกค้าบางรายไม่อยากให้ชื่อกับที่อยู่ขึ้นบนใบ ปิดได้ก่อนสั่งพิมพ์
  const [showCustomer, setShowCustomer] = useState(true);
  // ชื่อในบิลมียี่ห้อกับรุ่นรถต่อท้ายจนยาว ใบเสร็จจึงตัดเหลือแค่ชนิดอะไหล่ไว้ก่อน
  // เปิดสวิตช์เมื่อลูกค้าอยากรู้ว่าใส่ของยี่ห้อไหนรุ่นอะไร
  const [showBrand, setShowBrand] = useState(false);
  // ใบเสร็จให้ลูกค้า กับใบสั่งซ่อมให้ช่าง ใช้กระดาษกับปุ่มพิมพ์ชุดเดียวกัน
  const [docType, setDocType] = useState("receipt");

  const { contentRef, paperRef, scale, isMeasured } = usePaperFit({
    open,
    chromeEstimate: 180,
    onOpen: () => {
      setShowCustomer(true);
      setShowBrand(false);
      setDocType("receipt");
    },
  });

  if (!repair) return null;

  // ใบเสร็จยาวเกินหนึ่งแผ่นจะถูกแยกเป็นหลายใบ ใบสั่งซ่อมยังเป็นแผ่นเดียวเสมอ
  // (คำนวณหลังเช็กว่ามีบิลแล้ว หน้าที่ยังโหลดไม่เสร็จจะส่งค่าว่างมา)
  const pageCount =
    docType === "job" ? 1 : receiptPageCount(repair, { showBrand });

  const copyLabels = docType === "job" ? [null] : receiptCopyLabels(repair);
  const sheets = copyLabels.flatMap((copyLabel) =>
    Array.from({ length: pageCount }, (_, page) => ({ page, copyLabel })),
  );

  const customerName = repair.customer?.name || "";
  const customerAddress = repair.customer?.address || "";
  // บิลที่ไม่มีทั้งชื่อและที่อยู่ ปิดสวิตช์ไปก็ไม่มีอะไรหาย จึงไม่ต้องมีสวิตช์ให้กด
  const hasCustomerInfo = !!(
    customerName ||
    customerAddress ||
    repair.customer?.taxId ||
    repair.customer?.phoneNumber
  );
  // ใบสั่งซ่อมมีไว้ส่งงานให้ช่างที่ทำกับรถ ใช้กับงานซ่อมทั่วไปและงานเช็กช่วงล่าง
  // งานบริการที่ไม่ผูกรถกับบิลขายอะไหล่หน้าร้านจบที่หน้าร้าน ไม่มีงานให้ส่งต่อ
  // บิลเครดิตคือซ่อมเสร็จแล้วรอเก็บเงิน ช่างไม่มีงานให้ทำต่อ เหลือแค่ใบส่งของ
  const showJobSheetTab =
    !isSaleRepair(repair) &&
    !isNoVehicleRepair(repair) &&
    repair.status !== "CREDIT";
  // มีสวิตช์ชื่อแบบเต็มให้กดเฉพาะบิลที่มีของซึ่งย่อชื่อได้จริง (ช่วงล่างกับน้ำมัน)
  const canShortenNames = hasShortenableName(repair.repairItems || []);

  const handlePrintAtShop = async () => {
    if (isPrintingAtShop) return;

    try {
      setIsPrintingAtShop(true);
      await withMinDuration(() =>
        printRepairReceipt(repair.id, { showCustomer, showBrand, docType }),
      );
      onOpenChange(false);
      toast.success(
        docType === "job"
          ? "สั่งพิมพ์ใบสั่งซ่อมแล้ว"
          : `สั่งพิมพ์${receiptDocTitle(repair)}แล้ว`,
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

  // รูปทำจากหน้าเอกสารชุดเดียวกับที่พิมพ์ ลูกค้าได้รูปหน้าตาเหมือนกระดาษจริง
  const handleSaveImage = async () => {
    if (isSavingImage) return;

    try {
      setIsSavingImage(true);
      const res = await withMinDuration(() =>
        renderRepairImages(repair.id, { showCustomer, showBrand, docType }),
      );
      const images = res.data?.images || [];
      // ชื่อไฟล์เป็นเลขเอกสารล้วน คำนำหน้า RE DO QT บอกชนิดใบอยู่แล้ว และไม่มีภาษาไทยที่บางระบบอ่านเพี้ยน
      // บิลที่ยังไม่ได้เลข ใช้ชื่อใบนำหน้ารหัสการซ่อม จะได้รู้ว่าเป็นไฟล์อะไร
      const docNo =
        docType === "job" ? jobSheetNo(repair) : receiptDocNo(repair);
      const title = docType === "job" ? "ใบสั่งซ่อม" : receiptDocTitle(repair);
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
        // ความกว้างคงที่แบบไดอะล็อกอื่น ไม่หดตามกระดาษ
        // ถ้าให้กว้างตามกระดาษ ขนาดกระดาษก็คิดจากไดอะล็อกอีกที กลายเป็นวนกันเองจนเห็นขยับตอนเปิด
        // สูงตามเนื้อหาเหมือนไดอะล็อกอื่น ไม่ล็อกความสูงไว้ และจัดกึ่งกลางเหมือนกล่องอื่น
        className={`flex max-h-[92svh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden p-0 sm:max-w-[620px] ${
          isMeasured ? "" : "opacity-0"
        }`}
        showCloseButton={false}
        // ไม่มีอะไรให้กรอกในหน้านี้ ไม่ต้องโฟกัสปุ่มไหน
        // ปล่อยไว้ Radix จะไปโฟกัสปุ่มกากบาทให้เอง แล้วขึ้นกรอบไฮไลท์ตั้งแต่เปิด
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="receipt-chrome relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            {docType === "job"
              ? "ตัวอย่างใบสั่งซ่อม"
              : `ตัวอย่าง${receiptDocTitle(repair)}`}
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
              { id: "receipt", label: receiptDocTitle(repair) },
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
          style={{ height: PAPER_HEIGHT_MM * MM * scale }}
          className="mx-[16px] mb-[8px] min-h-0 shrink overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
        >
          {/* กรอบเท่าขนาดแผ่นหลังย่อ กันไม่ให้พื้นที่เลื่อนยาวเท่าขนาดกระดาษจริง
              เพราะการย่อเป็นการแปลงภาพ ขนาดในการจัดหน้ายังเท่าเดิม */}
          <div className="flex flex-col items-center gap-[12px]">
            {/* ใบส่งของมีต้นฉบับกับสำเนา แสดงครบทุกแผ่นตามลำดับที่เครื่องพิมพ์จะพิมพ์ออกมา */}
            {sheets.map(({ page, copyLabel }, sheetIndex) => (
              <div
                key={`${copyLabel}-${page}`}
                style={{
                  width: PAPER_WIDTH_MM * MM * scale,
                  height: PAPER_HEIGHT_MM * MM * scale,
                }}
                className="shrink-0"
              >
                {/* กระดาษจริง: ตัวนี้คือสิ่งเดียวที่ถูกพิมพ์ (ดูกฎ @media print ใน index.css) */}
                <div
                  ref={sheetIndex === 0 ? paperRef : undefined}
                  // ใบเสร็จเป็น flex แนวตั้ง ให้ QR ท้ายแผ่นขยายเต็มที่ว่างที่เหลือ
                  className={`receipt-paper font-athiti h-[210mm] w-[148mm] origin-top-left overflow-hidden bg-white p-[10mm] text-[11pt] leading-tight text-black ${
                    docType === "job" ? "" : "flex flex-col"
                  }`}
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
                      copyLabel={copyLabel}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="receipt-chrome flex-shrink-0 px-[16px] pt-[8px] pb-[16px]">
          <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={isSavingImage}
              className="font-athiti bg-surface text-primary border-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-[8px] rounded-[20px] border text-lg font-semibold whitespace-nowrap duration-300 disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
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
