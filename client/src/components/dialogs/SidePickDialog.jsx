import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ไม่ใช้ลูกศร เพราะ L คือซ้ายของรถ ไม่ใช่ซ้ายของคนดู ช่างที่หันหน้าเข้าหารถจะเห็นลูกศรผิดข้าง
const OPTIONS = [
  { value: "left", code: "L" },
  { value: "both", code: "L-R", needs: 2 },
  { value: "right", code: "R" },
];

const SidePickDialog = ({ isOpen, onClose, onPick, itemName, remaining }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent
      className="flex max-h-[90svh] w-full flex-col p-0"
      showCloseButton={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <DialogTitleBar
        title="เลือกข้าง"
        description={<>เลือกข้างของ {itemName}</>}
        onClose={onClose}
      />

      <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5 pb-5">
        {itemName && (
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
            {itemName}
          </h2>
        )}

        <div className="mt-4 flex gap-2">
          {OPTIONS.map(({ value, code, needs }) => {
            // L-R ใช้สองชิ้น สต็อกเหลือชิ้นเดียวเลือกไม่ได้
            const isDisabled =
              needs != null && remaining != null && remaining < needs;

            return (
              <button
                key={value}
                type="button"
                disabled={isDisabled}
                onClick={() => onPick(value)}
                className="active:border-primary active:bg-primary/5 text-primary flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-5 text-[28px] leading-none font-semibold duration-300 disabled:cursor-not-allowed disabled:opacity-40 md:text-[32px]"
              >
                {code}
              </button>
            );
          })}
        </div>

        {remaining != null && remaining < 2 && (
          <p className="text-subtle-light mt-2 text-center text-base font-medium md:text-lg">
            สต็อกเหลือไม่พอสำหรับ L-R
          </p>
        )}

        <button
          type="button"
          onClick={() => onPick("none")}
          className="font-athiti active:border-primary active:bg-primary/5 text-subtle-dark mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-lg font-semibold duration-300 md:text-xl"
        >
          ไม่ระบุข้าง
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default SidePickDialog;
