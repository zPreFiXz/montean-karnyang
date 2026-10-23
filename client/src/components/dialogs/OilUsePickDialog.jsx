import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// น้ำมันตัวเดียวใช้ได้หลายงาน (ดู oilUsesOf) ถามตอนหยิบลงบิลว่าใช้เติมอะไร ชื่อในบิลจะได้บอกงานที่ทำ
// แตะแล้วจบเลยเหมือนหน้าต่างเลือกข้าง การ์ดตัวเลือกหน้าตาชุดเดียวกัน
const OilUsePickDialog = ({ isOpen, onClose, onPick, itemName, uses }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent
      className="flex max-h-[85svh] w-full flex-col p-0"
      showCloseButton={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <DialogTitleBar
        title="ใช้เติมอะไร"
        description={<>เลือกงานที่ใช้ {itemName}</>}
        onClose={onClose}
      />

      <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px] pb-[20px]">
        {itemName && (
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
            {itemName}
          </h2>
        )}

        <div className="mt-[16px] flex gap-[8px]">
          {uses.map((use) => (
            <button
              key={use}
              type="button"
              onClick={() => onPick(use)}
              className="active:border-primary active:bg-primary/5 text-primary flex flex-1 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200 bg-gray-50 px-[4px] py-[20px] text-center text-lg leading-tight font-semibold duration-300 md:text-xl"
            >
              {use}
            </button>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default OilUsePickDialog;
