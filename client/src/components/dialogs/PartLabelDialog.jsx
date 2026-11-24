import { useEffect, useState } from "react";
import { Minus, Plus, Printer, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { previewPartLabel, printPartLabel } from "@/api/part";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

// ต้องตรงกับ partLabelSchema ฝั่งเซิร์ฟเวอร์
const MAX_COPIES = 100;

const clampCopies = (value) =>
  Math.min(Math.max(Math.trunc(Number(value)) || 1, 1), MAX_COPIES);

// พิมพ์สติกเกอร์ 60 x 40 มม. ติดอะไหล่: ชื่อ บาร์โค้ดรหัสอะไหล่ และราคาขาย
const PartLabelDialog = ({ part, open, onOpenChange }) => {
  const [showPrice, setShowPrice] = useState(true);
  const [copies, setCopies] = useState(1);
  const [copiesText, setCopiesText] = useState("1");
  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // เปิดใหม่ทุกครั้งเริ่มที่ 1 แผ่น กันพิมพ์ซ้ำจำนวนเดิมของชิ้นก่อนโดยไม่ตั้งใจ
  useEffect(() => {
    if (!open) return;
    setCopies(1);
    setCopiesText("1");
  }, [open, part?.id]);

  useEffect(() => {
    if (!open || !part?.id) return;
    let ignore = false;
    setIsPreviewLoading(true);
    previewPartLabel(part.id, { showPrice })
      .then((res) => !ignore && setPreview(res.data?.image || null))
      .catch((error) => !ignore && toastError(error, "โหลดตัวอย่างฉลากไม่ได้"))
      .finally(() => !ignore && setIsPreviewLoading(false));
    return () => {
      ignore = true;
    };
  }, [open, part?.id, showPrice]);

  // ปิดแล้วล้างรูปเก่า เปิดชิ้นถัดไปจะได้ไม่เห็นฉลากของชิ้นก่อนแวบหนึ่ง
  useEffect(() => {
    if (!open) setPreview(null);
  }, [open]);

  const setCopiesValue = (value) => {
    const next = clampCopies(value);
    setCopies(next);
    setCopiesText(String(next));
  };

  const stock = Number(part?.stockQuantity);
  // สต็อกเป็นจำนวนเต็ม (ไม่ใช่น้ำมันเป็นลิตร) เสนอปุ่มพิมพ์เท่าจำนวนของที่มี ใช้ตอนรับของเข้า
  const canMatchStock =
    Number.isInteger(stock) && stock > 1 && stock <= MAX_COPIES;

  const handlePrint = async () => {
    if (isPrinting) return;
    try {
      setIsPrinting(true);
      const res = await withMinDuration(() =>
        printPartLabel(part.id, { copies, showPrice }),
      );
      toast.success(res.data?.message || "สั่งพิมพ์ฉลากแล้ว");
      onOpenChange(false);
    } catch (error) {
      toastError(
        error,
        "พิมพ์ฉลากไม่สำเร็จ กรุณาตรวจสอบเครื่องพิมพ์แล้วลองใหม่อีกครั้ง",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitleBar
          title="พิมพ์ฉลาก"
          description={`พิมพ์สติกเกอร์ 60 x 40 มม. ของ ${part?.brand || ""} ${part?.name || ""}`}
          onClose={() => onOpenChange(false)}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          {/* กรอบสัดส่วน 3:2 เท่าสติกเกอร์จริง รูปยังไม่มาก็ไม่ยืดหดกล่อง */}
          <div className="mx-auto mt-2 aspect-[3/2] w-full max-w-90 overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm">
            {preview ? (
              <img
                src={preview}
                alt="ตัวอย่างฉลาก"
                className={`h-full w-full object-contain duration-300 [image-rendering:pixelated] ${
                  isPreviewLoading ? "opacity-40" : ""
                }`}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <LoaderCircle className="text-subtle-light h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
          <p className="text-subtle-light mt-1 text-center text-base md:text-lg">
            สติกเกอร์ 60 x 40 มม.
          </p>

          <button
            type="button"
            onClick={() => setShowPrice((value) => !value)}
            aria-pressed={showPrice}
            className="mx-auto mt-3 flex cursor-pointer items-center gap-2"
          >
            <span
              className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 ${
                showPrice ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`bg-surface h-4 w-4 rounded-full transition-transform duration-300 ${
                  showPrice ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
            <span
              className={`text-lg font-medium md:text-xl ${
                showPrice ? "text-primary" : "text-subtle-dark"
              }`}
            >
              แสดงราคาขาย
            </span>
          </button>

          <p className="text-normal mt-4 mb-2 text-[22px] font-semibold md:text-2xl">
            จำนวนแผ่น
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <button
              type="button"
              onClick={() => setCopiesValue(copies - 1)}
              disabled={copies <= 1}
              aria-label="ลดจำนวนแผ่น"
              className="bg-surface text-primary border-primary flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              aria-label="จำนวนแผ่น"
              value={copiesText}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                setCopiesText(digits);
                if (digits) setCopies(clampCopies(digits));
              }}
              onBlur={() => setCopiesValue(copiesText)}
              onFocus={(e) => e.target.select()}
              className="border-input bg-surface text-normal focus-visible:border-primary h-11 w-full min-w-0 flex-1 rounded-lg border text-center text-2xl font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => setCopiesValue(copies + 1)}
              disabled={copies >= MAX_COPIES}
              aria-label="เพิ่มจำนวนแผ่น"
              className="bg-gradient-primary text-surface flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {canMatchStock && (
            <button
              type="button"
              onClick={() => setCopiesValue(stock)}
              aria-pressed={copies === stock}
              className={`mt-2 cursor-pointer self-center rounded-full border px-4 py-1 text-base font-semibold duration-300 md:text-lg ${
                copies === stock
                  ? "bg-primary border-primary text-surface"
                  : "border-primary text-primary bg-surface"
              }`}
            >
              {`เท่าจำนวนในสต็อก (${stock} ${part?.unit || ""})`.trim()}
            </button>
          )}
        </div>

        <div className="flex-shrink-0 px-5 pt-4 pb-4">
          <FormButton
            label={
              isPrinting ? (
                `พิมพ์ ${copies} แผ่น`
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Printer className="h-4 w-4" />
                  {`พิมพ์ ${copies} แผ่น`}
                </div>
              )
            }
            isLoading={isPrinting}
            disabled={!copiesText}
            onClick={handlePrint}
            className="font-athiti bg-gradient-primary mr-0 ml-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartLabelDialog;
