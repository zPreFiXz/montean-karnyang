import { LoaderCircle } from "lucide-react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { toastError } from "@/utils/handleError";

// ต้องกดค้างนานเท่านี้ถึงจะลบจริง สั้นกว่านี้มือไวก็ยังรัวผ่านได้
// ยาวกว่านี้จะรู้สึกว่าปุ่มค้างไม่ทำงาน
const HOLD_MS = 900;

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "ยืนยันการลบ",
  itemName = "",
  // บรรทัดขยายใต้ชิป สำหรับกรณีที่ชื่ออย่างเดียวยังระบุตัวไม่ชัด (เช่น ทะเบียนรถ ต้องรู้ยี่ห้อรุ่นด้วย)
  itemDetail = "",
  // ข้อความเตือนสั้นๆ ใต้ชิป สำหรับผลที่คนกดคาดไม่ถึง (เช่นลบแล้วเลขเอกสารขาดช่วง)
  note = "",
  confirmLabel = "ลบ",
  confirmClass = "bg-destructive",
  // งานที่ลบของทิ้งต้องกดค้าง งานที่ย้อนกลับได้ (เช่นบันทึกเป็นใบประเมินราคา) กดครั้งเดียวพอ
  requireHold = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const cancelButtonRef = useRef(null);
  const [holdRatio, setHoldRatio] = useState(0);
  const holdRef = useRef({ frame: 0, startedAt: 0 });

  const stopHold = () => {
    cancelAnimationFrame(holdRef.current.frame);
    holdRef.current.frame = 0;
    setHoldRatio(0);
  };

  // ปิดกล่องระหว่างกดค้างต้องหยุดจับเวลา ไม่งั้นแถบจะเดินต่อ
  useEffect(() => {
    if (!isOpen) stopHold();
    return stopHold;
  }, [isOpen]);

  // ครบเวลาแล้วกล่องปิดทั้งที่นิ้วยังแตะอยู่ พอปล่อยนิ้วคลิกจะไปโดนปุ่มของหน้าข้างหลัง
  // จึงกลืนคลิกนั้นทิ้งที่ระดับเอกสาร จนกว่านิ้วจะปล่อยจริง
  const swallowNextClick = () => {
    const swallow = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const remove = () => document.removeEventListener("click", swallow, true);

    document.addEventListener("click", swallow, true);
    // คลิกมาหลังปล่อยนิ้วเสมอ จึงรอให้ปล่อยก่อนแล้วค่อยเผื่อเวลาอีกนิดก่อนถอด
    document.addEventListener("pointerup", () => setTimeout(remove, 350), {
      capture: true,
      once: true,
    });
    // ไม่มีการปล่อยนิ้วเลย (เช่นสั่งด้วยคีย์บอร์ด) ก็ต้องถอดออกอยู่ดี
    setTimeout(remove, 3000);
  };

  const startHold = (event) => {
    if (isLoading || holdRef.current.frame) return;

    // จับนิ้วนี้ไว้กับปุ่ม เลื่อนนิ้วออกนอกปุ่มก็ยังได้ pointerup ครบ
    if (event?.pointerId !== undefined) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    holdRef.current.startedAt = performance.now();
    const tick = (now) => {
      const ratio = Math.min((now - holdRef.current.startedAt) / HOLD_MS, 1);
      setHoldRatio(ratio);

      if (ratio >= 1) {
        stopHold();
        swallowNextClick();
        handleConfirm();
        return;
      }
      holdRef.current.frame = requestAnimationFrame(tick);
    };
    holdRef.current.frame = requestAnimationFrame(tick);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose?.();
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (
            cancelButtonRef.current &&
            typeof cancelButtonRef.current.focus === "function"
          ) {
            cancelButtonRef.current.focus();
          } else if (e?.target && typeof e.target.focus === "function") {
            e.target.focus();
          }
        }}
      >
        <DialogTitleBar
          title={title}
          description={`${title} ${itemName} ${itemDetail} ${note}`.trim()}
          onClose={onClose}
        />

        <div className="font-athiti flex flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-4">
          {itemName && (
            <span className="text-primary bg-primary/10 inline-block rounded-lg px-4 py-2 text-center text-lg font-semibold md:text-xl">
              {itemName}
              {itemDetail && (
                <>
                  <br />
                  {itemDetail}
                </>
              )}
            </span>
          )}
          {note && (
            <p className="text-subtle-dark mt-3 text-center text-base font-medium md:text-lg">
              {note}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 px-5 pb-4">
          <div className="flex gap-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              ref={cancelButtonRef}
            >
              ยกเลิก
            </button>

            {requireHold ? (
              <button
                type="button"
                disabled={isLoading}
                onPointerDown={(e) => {
                  // กันเบราว์เซอร์สร้างเหตุการณ์เมาส์จำลองตามหลังการแตะ
                  e.preventDefault();
                  startHold(e);
                }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                    e.preventDefault();
                    startHold();
                  }
                }}
                onKeyUp={stopHold}
                onContextMenu={(e) => e.preventDefault()}
                className={`font-athiti ${confirmClass} text-surface shadow-primary relative flex h-[41px] flex-1 cursor-pointer touch-none items-center justify-center overflow-hidden rounded-[20px] text-lg font-semibold select-none disabled:cursor-not-allowed disabled:opacity-70 md:text-xl`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-white/30"
                  style={{ width: `${holdRatio * 100}%` }}
                />
                <span className="relative flex items-center">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {confirmLabel}...
                    </>
                  ) : (
                    `กดค้างเพื่อ${confirmLabel}`
                  )}
                </span>
              </button>
            ) : (
              <FormButton
                label={confirmLabel}
                isLoading={isLoading}
                disabled={isLoading}
                onClick={handleConfirm}
                className={`font-athiti ${confirmClass} mr-0 ml-0 flex-1`}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
