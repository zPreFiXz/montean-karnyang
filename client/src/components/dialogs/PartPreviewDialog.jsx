import { X, Image as ImageIcon } from "lucide-react";
import { SparePart } from "@/components/icons/Icons";
import { formatCurrency } from "@/utils/formats";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// ดูรูปกับข้อมูลสั้นๆ ของอะไหล่ก่อนตัดสินใจเลือก
// ตั้งใจไม่ใช้ RepairItemDetailDialog เพราะตัวนั้นมีปุ่มเพิ่มสต็อก/แก้ไข/ลบ
// ซึ่งไม่ควรอยู่ตรงหน้าระหว่างกำลังเปิดบิลให้ลูกค้า
const PartPreviewDialog = ({ part, price, open, onOpenChange }) => {
  if (!part) return null;

  const hasAdjustedPrice =
    price != null && Number(price) !== Number(part.sellingPrice);
  const priceDiff = Number(price) - Number(part.sellingPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
      >
        <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          {/* หัวเรื่องบอกว่าหน้าต่างนี้คืออะไร ชื่ออะไหล่ไปอยู่ในเนื้อหาข้างล่าง
              รูปแบบเดียวกับหน้าต่างแก้ราคาและหน้าต่างรายละเอียดอะไหล่ */}
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            รายละเอียดอะไหล่
          </DialogTitle>
          <DialogDescription className="sr-only">
            รูปและข้อมูลของ {part.name}
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px] pb-[16px]">
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
            {part.name}
          </h2>

          <div className="mt-[16px] flex justify-center">
            <div className="border-input flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[20px] border-2">
              {part.secureUrl ? (
                <img
                  src={part.secureUrl}
                  alt={part.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <SparePart className="text-subtle-light h-20 w-20" />
              )}
            </div>
          </div>

          <div className="mt-[16px] space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
            {part.partNumber && (
              <div className="flex justify-between gap-[12px]">
                <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                  รหัสอะไหล่:
                </p>
                <p className="text-normal min-w-0 text-right text-lg font-semibold break-words md:text-xl">
                  {part.partNumber}
                </p>
              </div>
            )}

            {part.description && (
              <div className="flex justify-between gap-[12px]">
                <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                  รายละเอียด:
                </p>
                <p className="text-normal min-w-0 text-right text-lg font-semibold break-words whitespace-pre-line md:text-xl">
                  {part.description}
                </p>
              </div>
            )}

            {/* ราคาตั้งต้นจากคลัง ขึ้นเฉพาะตอนที่ราคาถูกปรับไปแล้ว — เกณฑ์เดียวกับไดอะล็อกแก้ราคา
                ถ้าไม่บอกไว้ คนที่เปิดดูชิ้นที่ยังไม่ได้เลือกจะไม่รู้ว่าราคานี้ถูกลดมาแล้ว */}
            {hasAdjustedPrice && (
              <div className="flex justify-between gap-[12px]">
                <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                  ราคาปกติ:
                </p>
                <p className="text-subtle-dark min-w-0 text-right text-lg font-semibold md:text-xl">
                  {formatCurrency(Number(part.sellingPrice) || 0)}
                </p>
              </div>
            )}

            {/* ราคาที่จะถูกใช้จริงถ้าเลือกชิ้นนี้ (รวมราคาที่ปรับไว้แล้ว) จึงรับมาจากหน้าที่เรียก
                ไม่ได้อ่านจาก part.sellingPrice ตรงๆ
                เปลี่ยนป้ายเมื่อมีการปรับราคา ไม่งั้นสองบรรทัดจะดูเป็นราคาคนละแบบโดยไม่บอกว่าอันไหนคืออันที่แก้ */}
            <div className="flex justify-between gap-[12px]">
              <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                {hasAdjustedPrice ? "ราคาที่ปรับ:" : "ราคาต่อหน่วย:"}
              </p>
              <p className="text-primary min-w-0 text-right text-lg font-semibold md:text-xl">
                {formatCurrency(Number(price ?? part.sellingPrice) || 0)}
                {/* ส่วนต่างจากราคาคลัง — ลูกค้าต่อราคาแล้วรู้ทันทีว่าลดไปเท่าไหร่ ไม่ต้องคิดเลขเอง */}
                {hasAdjustedPrice && (
                  <span className="text-subtle-dark font-medium">
                    {" "}
                    ({priceDiff < 0 ? "ลด" : "เพิ่ม"}{" "}
                    {formatCurrency(Math.abs(priceDiff))})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartPreviewDialog;
