import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Minus,
  Plus,
  Printer,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { previewPartLabel, printPartLabel } from "@/api/part";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import useAuthStore from "@/stores/useAuthStore";
import { formatCurrency } from "@/utils/formats";

// ต้องตรงกับ partLabelSchema ฝั่งเซิร์ฟเวอร์
const MAX_COPIES = 100;

// ต้องตรงกับ LABEL_SIZES ใน server/utils/printLabel.js
const LABEL_SIZES = [
  { id: "60x40", label: "60 x 40 มม.", aspect: "aspect-[3/2]" },
  { id: "50x30", label: "50 x 30 มม.", aspect: "aspect-[5/3]" },
  { id: "40x30", label: "40 x 30 มม.", aspect: "aspect-[4/3]" },
  { id: "40x20", label: "40 x 20 มม.", aspect: "aspect-[2/1]" },
];
// ส่วนใหญ่ใช้ม้วนเดิมต่อกัน จำขนาดที่เลือกล่าสุดไว้ในเครื่อง
const SIZE_KEY = "part-label-size";
const loadSize = () => {
  try {
    const saved = localStorage.getItem(SIZE_KEY);
    return LABEL_SIZES.some((s) => s.id === saved) ? saved : "60x40";
  } catch {
    return "60x40";
  }
};

const clampCopies = (value) =>
  Math.min(Math.max(Math.trunc(Number(value)) || 1, 1), MAX_COPIES);

// พิมพ์สติกเกอร์ติดอะไหล่ (เลือกขนาดตามม้วนที่ใส่): ชื่อ บาร์โค้ดรหัสอะไหล่ และราคาขายพร้อมหน่วย (แสดงเสมอ)
// onCostSaved(ราคาใหม่) = บันทึกราคาต้นทุนแล้ว ให้หน้าต่างรายละเอียดอัปเดตตัวเลขตาม
const PartLabelDialog = ({ part, open, onOpenChange, onCostSaved }) => {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const [size, setSize] = useState(loadSize);
  const [copies, setCopies] = useState(1);
  // ราคาทุนที่แปลงเป็นรหัสลับบนฉลาก ว่าง = ไม่พิมพ์รหัส
  const [costText, setCostText] = useState("");
  const [costForPreview, setCostForPreview] = useState("");
  // ใส่ราคาทุนของชิ้นนี้เสร็จแล้วค่อยวาดตัวอย่าง ไม่งั้นรอบแรกวาดโดยไม่มีรหัสแล้ววาดซ้ำ
  const [costPartId, setCostPartId] = useState(null);
  // ไม่ติ๊กไว้ให้ ต้องตั้งใจติ๊กเองถึงจะบันทึก กันคนกดพิมพ์เร็วแล้วราคาในสต็อกเปลี่ยนโดยไม่ตั้งใจ
  const [saveCost, setSaveCost] = useState(false);
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

  // ใส่ราคาทุนในคลังไว้ให้ก่อน ร้านส่วนใหญ่ติดรหัสตามทุนจริง
  useEffect(() => {
    if (!open) return;
    const cost =
      part?.costPrice != null ? String(Math.round(Number(part.costPrice))) : "";
    setCostText(cost);
    setCostForPreview(cost);
    setSaveCost(false);
    setCostPartId(part?.id ?? null);
  }, [open, part?.id, part?.costPrice]);

  // พิมพ์ราคาอยู่ยังไม่ต้องวาดตัวอย่างใหม่ทุกตัวเลข รอหยุดพิมพ์ครู่หนึ่ง
  useEffect(() => {
    const timer = setTimeout(() => setCostForPreview(costText), 400);
    return () => clearTimeout(timer);
  }, [costText]);

  const costPayload =
    costForPreview === "" ? {} : { costPrice: Number(costForPreview) };

  useEffect(() => {
    if (!open || !part?.id || costPartId !== part.id) return;
    let ignore = false;
    setIsPreviewLoading(true);
    previewPartLabel(part.id, { size, ...costPayload })
      .then((res) => !ignore && setPreview(res.data?.image || null))
      .catch((error) => !ignore && toastError(error, "โหลดตัวอย่างฉลากไม่ได้"))
      .finally(() => !ignore && setIsPreviewLoading(false));
    return () => {
      ignore = true;
    };
    // costPayload สร้างใหม่ทุกเรนเดอร์ ดูจากค่าที่หน่วงไว้แทน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, part?.id, size, costForPreview, costPartId]);

  const chooseSize = (next) => {
    setSize(next);
    try {
      localStorage.setItem(SIZE_KEY, next);
    } catch {
      // เก็บไม่ได้ก็แค่ไม่จำ เปิดครั้งหน้าเริ่มที่ 60 x 40
    }
  };
  const sizeInfo = LABEL_SIZES.find((s) => s.id === size);

  // ปิดแล้วล้างรูปเก่า เปิดชิ้นถัดไปจะได้ไม่เห็นฉลากของชิ้นก่อนแวบหนึ่ง
  useEffect(() => {
    if (open) return;
    setPreview(null);
    setCostPartId(null);
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

  const storedCost =
    part?.costPrice != null ? Math.round(Number(part.costPrice)) : null;
  const isCostDifferent = costText !== "" && Number(costText) !== storedCost;
  const canSaveCost = isAdmin && isCostDifferent;

  const handlePrint = async () => {
    if (isPrinting) return;
    try {
      setIsPrinting(true);
      const res = await withMinDuration(() =>
        printPartLabel(part.id, {
          copies,
          size,
          ...(costText === "" ? {} : { costPrice: Number(costText) }),
          saveCostPrice: canSaveCost && saveCost,
        }),
      );
      toast.success(res.data?.message || "สั่งพิมพ์ฉลากแล้ว");
      if (res.data?.costPrice != null) onCostSaved?.(res.data.costPrice);
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
          description={`พิมพ์สติกเกอร์ ${sizeInfo.label} ของ ${part?.brand || ""} ${part?.name || ""}`}
          onClose={() => onOpenChange(false)}
        />

        {/* หน้าตาแบบหน้าต่างแก้ไขอื่น (DepositDialog): รูปตัวอย่างบอกชื่ออะไหล่อยู่แล้ว ตัวเลือกอยู่ในกล่องเทา */}
        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          {/* กรอบสัดส่วนเท่าสติกเกอร์จริง รูปยังไม่มาก็ไม่ยืดหดกล่อง */}
          <div
            className={`mx-auto w-full max-w-90 overflow-hidden rounded-lg border border-gray-200 bg-white ${sizeInfo.aspect}`}
          >
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
                <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                ขนาดสติกเกอร์
              </p>
              {/* แถบเทาแบบแท็บในแผ่นขาวหน้าอื่น */}
              <div
                role="radiogroup"
                aria-label="ขนาดสติกเกอร์"
                className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
              >
                {LABEL_SIZES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={size === item.id}
                    onClick={() => chooseSize(item.id)}
                    className={`h-10 cursor-pointer rounded-lg text-lg font-semibold duration-300 md:text-xl ${
                      size === item.id
                        ? "bg-gradient-primary text-surface shadow-lg"
                        : "text-subtle-dark"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="label-cost"
                className="text-subtle-dark mb-2 block text-lg font-medium md:text-xl"
              >
                ราคาต้นทุน
              </label>
              <input
                id="label-cost"
                type="text"
                inputMode="numeric"
                value={costText}
                onChange={(e) =>
                  setCostText(e.target.value.replace(/\D/g, "").slice(0, 7))
                }
                placeholder="เช่น 350"
                className="border-input bg-surface text-normal focus-visible:border-primary placeholder:text-subtle-light h-11 w-full rounded-[20px] border px-4 text-lg font-medium outline-none md:text-xl"
              />
              {isCostDifferent && (
                <p className="text-status-progress mt-2 flex items-start gap-1.5 text-base font-medium md:text-lg">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
                  {storedCost == null
                    ? "ยังไม่มีราคาต้นทุน"
                    : `ราคาต้นทุนเดิม ${formatCurrency(storedCost)}`}
                </p>
              )}
              {canSaveCost && (
                // สวิตช์แบบเดียวกับ "ค้างตั้งศูนย์" ในบิล เริ่มที่ปิด ต้องตั้งใจกดเองถึงจะบันทึก
                <button
                  type="button"
                  role="switch"
                  aria-checked={saveCost}
                  onClick={() => setSaveCost((value) => !value)}
                  className="mt-2 flex cursor-pointer items-center gap-2 text-left"
                >
                  <span
                    className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 ${
                      saveCost ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`bg-surface h-4 w-4 rounded-full transition-transform duration-300 ${
                        saveCost ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </span>
                  <span
                    className={`text-lg font-medium md:text-xl ${
                      saveCost ? "text-primary" : "text-subtle-dark"
                    }`}
                  >
                    {`บันทึกราคาต้นทุนใหม่ ${formatCurrency(Number(costText))}`}
                  </span>
                </button>
              )}
            </div>

            <div>
              <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                จำนวนแผ่น
              </p>
              {/* ปุ่มลดเพิ่มทรงเดียวกับปุ่มจำนวนในรายการบิล */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCopiesValue(copies - 1)}
                  disabled={copies <= 1}
                  aria-label="ลดจำนวนแผ่น"
                  className="bg-surface text-subtle-dark flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="จำนวนแผ่น"
                  value={copiesText}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 3);
                    setCopiesText(digits);
                    if (digits) setCopies(clampCopies(digits));
                  }}
                  onBlur={() => setCopiesValue(copiesText)}
                  onFocus={(e) => e.target.select()}
                  className="border-input bg-surface text-normal focus-visible:border-primary h-11 w-full min-w-0 flex-1 rounded-[20px] border text-center text-xl font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCopiesValue(copies + 1)}
                  disabled={copies >= MAX_COPIES}
                  aria-label="เพิ่มจำนวนแผ่น"
                  className="bg-surface text-subtle-dark flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {canMatchStock && (
                <button
                  type="button"
                  onClick={() => setCopiesValue(stock)}
                  aria-pressed={copies === stock}
                  className={`mx-auto mt-3 flex cursor-pointer rounded-full border px-4 py-1 text-base font-semibold duration-300 md:text-lg ${
                    copies === stock
                      ? "bg-primary border-primary text-surface"
                      : "border-primary text-primary bg-surface"
                  }`}
                >
                  {`เท่าจำนวนสต็อก (${stock} ${part?.unit || ""})`.trim()}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPrinting}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
            >
              ยกเลิก
            </button>
            <FormButton
              label={
                isPrinting ? (
                  `พิมพ์ ${copies} แผ่น`
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Printer className="h-4 w-4" />
                    {`พิมพ์ ${copies} แผ่น`}
                  </span>
                )
              }
              isLoading={isPrinting}
              disabled={!copiesText}
              onClick={handlePrint}
              className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartLabelDialog;
