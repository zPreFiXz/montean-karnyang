import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import InventoryBrowser from "@/components/inventory/InventoryBrowser";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import { BoxSearch } from "@/components/icons/Icons";

const InventoryList = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [selectedItem, setSelectedItem] = useState(
    location.state?.openItem ?? null,
  );
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(
    !!location.state?.openItem,
  );
  // เปลี่ยนค่านี้เพื่อสั่งให้รายการโหลดใหม่หลังแก้สต็อกจากไดอะล็อก
  const [reloadToken, setReloadToken] = useState(0);

  const activeCategory = searchParams.get("category");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // มาจากหน้าแก้ไข: ข้อมูลหลังแก้ติดมากับ state แล้ว จึงเปิดได้ตั้งแต่เฟรมแรก
  // ล้าง state ทิ้งทันที ไม่งั้นกดย้อนกลับมาหน้านี้อีกครั้งไดอะล็อกจะเด้งขึ้นมาเองซ้ำ
  useEffect(() => {
    if (location.state?.openItem) {
      window.history.replaceState(null, document.title, window.location.href);
    }
  }, [location.state]);

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="bg-surface/20 flex h-[40px] w-[40px] items-center justify-center rounded-full">
          <BoxSearch color="#ffffff" />
        </div>
        <div>
          <p className="text-surface text-2xl font-semibold md:text-[26px]">
            อะไหล่และบริการ
          </p>
        </div>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        <div className="flex flex-1 flex-col px-[20px] pt-[16px]">
          <InventoryBrowser
            syncUrl
            reloadToken={reloadToken}
            onItemClick={(item) => {
              setSelectedItem(item);
              setIsItemDetailOpen(true);
            }}
            headerAction={
              <Link
                to={
                  activeCategory && activeCategory !== "ทั้งหมด"
                    ? `/inventory/new?category=${encodeURIComponent(activeCategory)}`
                    : "/inventory/new"
                }
                className="text-primary shrink-0 cursor-pointer text-xl font-semibold whitespace-nowrap md:text-[22px]"
              >
                + เพิ่มรายการ
              </Link>
            }
          />
        </div>
      </div>

      <RepairItemDetailDialog
        item={selectedItem}
        open={isItemDetailOpen}
        onOpenChange={setIsItemDetailOpen}
        onStockUpdate={() => setReloadToken((n) => n + 1)}
      />
    </div>
  );
};
export default InventoryList;
