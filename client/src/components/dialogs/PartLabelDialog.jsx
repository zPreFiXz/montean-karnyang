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
import FieldErrorList from "@/components/forms/FieldErrorList";
import { previewPartLabel, printPartLabel } from "@/api/part";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import useAuthStore from "@/stores/useAuthStore";
import { formatCurrency } from "@/utils/formats";

// ต้องตรงกับ partLabelSchema ฝั่งเซิร์ฟเวอร์
const MAX_COPIES = 10;

// ต้องตรงกับ LABEL_SIZES ใน server/utils/printLabel.js
const LABEL_SIZES = [
  { id: "60x40", label: "60 x 40 มม.", aspect: "aspect-[3/2]" },
  { id: "50x30", label: "50 x 30 มม.", aspect: "aspect-[5/3]" },
  { id: "40x30", label: "40 x 30 มม.", aspect: "aspect-[4/3]" },
  { id: "40x20", label: "40 x 20 มม.", aspect: "aspect-[2/1]" },
];
// ร้านค้าที่สั่งอะไหล่ รหัสพิมพ์ก่อนรหัสทุน (ต้องตรงกับ supplierCode ใน partLabelSchema)
// ไม่ระบุ = ไม่ส่งรหัสร้าน เซิร์ฟเวอร์ใส่ MT นำหน้ารหัสทุนให้ (ดู OWN_STOCK_CODE)
const LABEL_SUPPLIERS = [
  { code: "", name: "ไม่ระบุ" },
  { code: "PM", name: "พัฒนามอเตอร์" },
  { code: "BKP", name: "บางกอกออโต้พาร์ท" },
  { code: "NC", name: "เอ็นซี" },
  { code: "H2H", name: "แฮนด์ทูแฮนด์" },
  { code: "RJR", name: "รวมเจริญ" },
];

const clampCopies = (value) =>
  Math.min(Math.max(Math.trunc(Number(value)) || 1, 1), MAX_COPIES);

// พิมพ์สติกเกอร์ติดอะไหล่ (เลือกขนาดตามม้วนที่ใส่): รหัส ชื่อ และราคาขายพร้อมหน่วย (แสดงเสมอ)
// onCostSaved(ราคาใหม่) = บันทึกราคาต้นทุนแล้ว ให้หน้าต่างรายละเอียดอัปเดตตัวเลขตาม
const PartLabelDialog = ({ part, open, onOpenChange, onCostSaved }) => {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  // ขนาดกับร้านไม่เลือกไว้ให้ ต้องอ่านแล้วเลือกเองทุกครั้ง null = ยังไม่เลือก
  const [size, setSize] = useState(null);
  const [copies, setCopies] = useState(1);
  // ราคาทุนที่แปลงเป็นรหัสลับบนฉลาก ว่าง = ไม่พิมพ์รหัส
  const [costText, setCostText] = useState("");
  const [costForPreview, setCostForPreview] = useState("");
  // ใส่ราคาทุนของชิ้นนี้เสร็จแล้วค่อยวาดตัวอย่าง ไม่งั้นรอบแรกวาดโดยไม่มีรหัสแล้ววาดซ้ำ
  const [costPartId, setCostPartId] = useState(null);
  // ไม่ติ๊กไว้ให้ ต้องตั้งใจติ๊กเองถึงจะบันทึก กันคนกดพิมพ์เร็วแล้วราคาในสต็อกเปลี่ยนโดยไม่ตั้งใจ
  const [saveCost, setSaveCost] = useState(false);
  // ร้านที่สั่งของชิ้นนี้ ค่าว่าง = ไม่ระบุ
  const [supplierCode, setSupplierCode] = useState(null);
  const [missing, setMissing] = useState({});
  const [copiesText, setCopiesText] = useState("1");
  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // เปิดใหม่ทุกครั้งเริ่มที่ 1 แผ่น กันพิมพ์ซ้ำจำนวนเดิมของชิ้นก่อนโดยไม่ตั้งใจ
  useEffect(() => {
    if (!open) return;
    setCopies(1);
    setCopiesText("1");
    setSize(null);
    setSupplierCode(null);
    setMissing({});
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

  // ยังไม่เลือกกับไม่ระบุได้ฉลากเหมือนกัน ไม่ต้องวาดตัวอย่างใหม่
  const printedSupplier = supplierCode || "";
  const supplierPayload = printedSupplier
    ? { supplierCode: printedSupplier }
    : {};
  const costPayload = {
    ...supplierPayload,
    ...(costForPreview === "" ? {} : { costPrice: Number(costForPreview) }),
  };

  useEffect(() => {
    if (!open || !part?.id || !size || costPartId !== part.id) return;
    let ignore = false;
    setIsPreviewLoading(true);
    previewPartLabel(part.id, { size, ...costPayload })
      .then((res) => !ignore && setPreview(res.data?.image || null))
      .catch(
        (error) =>
          !ignore &&
          toastError(error, "โหลดตัวอย่างฉลากไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"),
      )
      .finally(() => !ignore && setIsPreviewLoading(false));
    return () => {
      ignore = true;
    };
    // costPayload สร้างใหม่ทุกเรนเดอร์ ดูจากค่าที่หน่วงไว้แทน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, part?.id, size, costForPreview, costPartId, printedSupplier]);

  const chooseSize = (next) => {
    setSize(next);
    setMissing((prev) => ({ ...prev, size: false }));
  };
  const chooseSupplier = (code) => {
    setSupplierCode(code);
    setMissing((prev) => ({
      ...prev,
      supplier: false,
      cost: prev.cost && !!code,
    }));
  };
  // ยังไม่เลือกขนาด กรอบตัวอย่างใช้สัดส่วนม้วนใหญ่สุดไปก่อน
  const sizeInfo = LABEL_SIZES.find((s) => s.id === size) || {
    aspect: LABEL_SIZES[0].aspect,
  };

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

  const storedCost =
    part?.costPrice != null ? Math.round(Number(part.costPrice)) : null;
  const isCostDifferent = costText !== "" && Number(costText) !== storedCost;
  const canSaveCost = isAdmin && isCostDifferent;

  const handlePrint = async () => {
    if (isPrinting) return;
    // เลือกร้านแล้วต้องมีราคาต้นทุน ไม่งั้นรหัสบนฉลากมีแต่รหัสร้าน (ต้องตรงกับ partLabelPrintSchema)
    const next = {
      size: !size,
      supplier: supplierCode === null,
      cost: !!supplierCode && costText === "",
    };
    if (next.size || next.supplier || next.cost) {
      setMissing(next);
      return;
    }
    try {
      setIsPrinting(true);
      const res = await withMinDuration(() =>
        printPartLabel(part.id, {
          copies,
          size,
          ...supplierPayload,
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
          description={`พิมพ์สติกเกอร์ของ ${part?.brand || ""} ${part?.name || ""}`}
          onClose={() => onOpenChange(false)}
        />

        {/* หน้าตาแบบหน้าต่างแก้ไขอื่น (DepositDialog): รูปตัวอย่างบอกชื่ออะไหล่อยู่แล้ว ตัวเลือกอยู่ในกล่องเทา */}
        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          {/* กรอบสัดส่วนเท่าสติกเกอร์จริง สูงคงที่ทุกขนาด สลับขนาดแล้วหน้าต่างไม่ยืดหด รูปยังไม่มาก็ไม่ยืดหดกล่อง
              shrink-0 เพราะจอเตี้ยเนื้อหาเกินความสูงหน้าต่าง กล่องรูปจะถูกบีบจนหายแทนที่จะเลื่อนดู */}
          <div
            className={`mx-auto h-42 max-w-full shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white md:h-60 ${sizeInfo.aspect}`}
          >
            {preview ? (
              <img
                src={preview}
                alt="ตัวอย่างฉลาก"
                className={`h-full w-full object-contain duration-300 [image-rendering:pixelated] ${
                  isPreviewLoading ? "opacity-40" : ""
                }`}
              />
            ) : size ? (
              <div className="flex h-full items-center justify-center">
                <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="text-subtle-light flex h-full items-center justify-center px-4 text-center text-lg font-medium md:text-xl">
                เลือกขนาดเพื่อดูตัวอย่าง
              </div>
            )}
          </div>

          <div className="mt-4 shrink-0 space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                ขนาดสติกเกอร์
              </p>
              {/* แถบเทาแบบแท็บในแผ่นขาวหน้าอื่น */}
              <div
                role="radiogroup"
                aria-label="ขนาดสติกเกอร์"
                className="grid grid-cols-2 gap-2"
              >
                {LABEL_SIZES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={size === item.id}
                    onClick={() => chooseSize(item.id)}
                    className={`h-10 cursor-pointer rounded-lg border text-lg font-semibold duration-300 md:text-xl ${
                      size === item.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "bg-surface text-subtle-dark border-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <FieldErrorList
                className="mt-1.5"
                messages={[missing.size && "กรุณาเลือกขนาดสติกเกอร์"]}
              />
            </div>

            <div>
              <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                สั่งจากร้าน
              </p>
              <div
                role="radiogroup"
                aria-label="สั่งจากร้าน"
                className="grid grid-cols-3 gap-2"
              >
                {LABEL_SUPPLIERS.map((item) => (
                  <button
                    key={item.code || "none"}
                    type="button"
                    role="radio"
                    aria-checked={supplierCode === item.code}
                    onClick={() => chooseSupplier(item.code)}
                    // ปุ่มแสดงรหัสที่พิมพ์ลงฉลาก ชื่อเต็มอยู่ที่ title และโปรแกรมอ่านหน้าจอ
                    title={item.code ? item.name : undefined}
                    aria-label={item.name}
                    className={`h-10 cursor-pointer rounded-lg border px-2 text-lg font-semibold duration-300 md:text-xl ${
                      supplierCode === item.code
                        ? "border-primary bg-primary/5 text-primary"
                        : "bg-surface text-subtle-dark border-gray-200"
                    }`}
                  >
                    {item.code || item.name}
                  </button>
                ))}
              </div>
              <FieldErrorList
                className="mt-1.5"
                messages={[missing.supplier && "กรุณาเลือกร้านที่สั่ง"]}
              />
            </div>

            {/* ราคาต้นทุนกับจำนวนแผ่นเป็นตัวเลขสั้น วางแถวเดียวกัน หน้าต่างจะพอดีจอมือถือ
                คำเตือนกับสวิตช์บันทึกราคายาวกว่าครึ่งแถว จึงอยู่ใต้แถวเต็มความกว้าง */}
            <div>
              <div className="grid grid-cols-2 gap-3">
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
                    onChange={(e) => {
                      setCostText(
                        e.target.value.replace(/\D/g, "").slice(0, 7),
                      );
                      setMissing((prev) => ({ ...prev, cost: false }));
                    }}
                    placeholder="เช่น 350"
                    aria-invalid={missing.cost ? "true" : "false"}
                    className={`bg-surface ${missing.cost ? "border-destructive" : "border-input"} text-normal focus-visible:border-primary placeholder:text-subtle-light h-11 w-full rounded-[20px] border px-4 text-lg font-medium outline-none md:text-xl`}
                  />
                </div>
                <div>
                  <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                    จำนวนแผ่น
                  </p>
                  {/* ปุ่มลดเพิ่มทรงเดียวกับปุ่มจำนวนในรายการบิล ตัวเลขไม่มีกรอบ กดแล้วพิมพ์จำนวนเองได้ */}
                  <div className="flex items-center gap-1.5">
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
                      className="text-primary focus-visible:ring-primary/35 h-11 w-full min-w-0 flex-1 rounded-md bg-transparent text-center text-xl font-semibold outline-none focus-visible:ring-2"
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
                </div>
              </div>
              <FieldErrorList
                className="mt-1.5"
                messages={[missing.cost && "กรุณากรอกราคาต้นทุน"]}
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
