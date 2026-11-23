import { useEffect, useState } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { getStatusInfo } from "@/constants/repairStatus";
import { getRepairTitle } from "@/utils/repairDisplay";

// บอกผลของการถอยไปแต่ละสถานะ เทียบกับสถานะตอนนี้ (ล้างอะไรบ้าง)
const effectOf = (from, to) => {
  const effects = [];
  if (from === "CREDIT" && to !== "CREDIT") effects.push("ยกเลิกการลงเครดิต");
  if (to === "CREDIT") effects.push("กลับไปค้างชำระในหน้าเครดิต");
  return effects.join(" ");
};

// ถอยสถานะได้หลายขั้น เลือกสถานะแล้วกดยืนยัน เลขที่เอกสารกับสต็อกไม่เปลี่ยน
// หน้าตาแบบหน้าต่างแก้ไขอื่นในโปรเจค (DepositDialog) ตัวเลือกเป็นการ์ดแถวเดียวแบบ OrganizationTypeDialog
const StatusRevertDialog = ({
  isOpen,
  onClose,
  repair,
  targets,
  onConfirm,
}) => {
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setSelected(targets[0] || null);
    // เลือกขั้นที่ใกล้ที่สุดไว้ก่อน เปิดใหม่ทุกครั้งเริ่มจากค่านี้
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await onConfirm(selected);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const current = getStatusInfo(repair?.status, repair?.type);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSaving && onClose()}
    >
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
      >
        <DialogTitleBar
          title="แก้ไขสถานะ"
          description="เลือกสถานะที่ต้องการย้อนกลับไป"
          onClose={onClose}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          <h2 className="text-normal mb-4 text-center text-[22px] leading-tight font-semibold md:text-2xl">
            {getRepairTitle(repair)}
          </h2>

          {/* ทุกอย่างอยู่ในกล่องเทากล่องเดียว แบบหน้าต่างแก้ไขการชำระบางส่วน (DepositDialog) */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-subtle-dark text-lg font-medium md:text-xl">
                สถานะปัจจุบัน:
              </p>
              <p
                className={`text-lg font-semibold md:text-xl ${current.color}`}
              >
                {current.text}
              </p>
            </div>

            <div>
              <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                ย้อนกลับเป็น
              </p>
              <div className="flex gap-2">
                {/* เรียงตามลำดับงานซ้ายไปขวา (กำลังซ่อมซ้ายสุด) ตัวที่เลือกไว้ก่อนยังเป็นขั้นที่ใกล้ที่สุด */}
                {[...targets].reverse().map((status) => {
                  const info = getStatusInfo(status, repair?.type);
                  const Icon = info.icon;
                  const isActive = selected === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelected(status)}
                      aria-pressed={isActive}
                      className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-1 py-3 duration-300 ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "bg-surface border-gray-200"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full duration-300 ${
                          isActive ? info.bg : "bg-subtle-light/25"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive ? "text-surface" : "text-subtle-dark"
                          }`}
                        />
                      </span>
                      <span
                        // สามการ์ดบนมือถือแคบ ชื่อยาวสุด (ซ่อมเสร็จสิ้น) ต้องอยู่บรรทัดเดียว
                        className={`text-center text-base font-semibold whitespace-nowrap sm:text-lg md:text-xl ${
                          isActive ? info.color : "text-subtle-dark"
                        }`}
                      >
                        {info.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ผลของตัวที่เลือก ไม่มีผลที่ต้องบอกก็ไม่ขึ้น */}
            {selected && effectOf(repair?.status, selected) && (
              <p className="text-subtle-dark text-center text-base font-medium text-balance md:text-lg">
                {effectOf(repair?.status, selected)}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
            >
              ยกเลิก
            </button>
            <FormButton
              label="ยืนยัน"
              isLoading={isSaving}
              disabled={isSaving || !selected}
              onClick={handleConfirm}
              className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusRevertDialog;
