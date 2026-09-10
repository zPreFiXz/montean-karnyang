import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { getInventory } from "@/api/inventory";
import InventoryBrowser from "@/components/inventory/InventoryBrowser";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import { BoxSearch } from "@/components/icons/Icons";
import { useScrollRestoration } from "@/utils/scrollPosition";
import { usePrefetchPages } from "@/routes/pageImports";

const InventoryList = () => {
  // เตรียมโค้ดของหน้าที่มักไปต่อจากหน้านี้ กดแล้วจะได้ไม่ต้องรอโหลด
  usePrefetchPages(["InventoryEdit", "InventoryCreate", "InventoryUsage"]);

  const [searchParams, setSearchParams] = useSearchParams();
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
  const [isListLoading, setIsListLoading] = useState(true);

  // หมวดหมู่กับตัวกรองอยู่ใน URL อยู่แล้ว จำตำแหน่งแยกของแต่ละหมวดได้เลย
  useScrollRestoration(location.pathname + location.search, !isListLoading);

  // ออกไปหน้าแก้ไขหรือหน้าประวัติแล้วกดย้อนกลับ: ไดอะล็อกต้องเปิดค้างไว้เหมือนตอนจากไป
  // จำไว้ใน URL (item=part-43) เพราะ URL คือสิ่งเดียวที่ติดอยู่กับหน้าในประวัติของเบราว์เซอร์
  const openItemParam = searchParams.get("item");
  useEffect(() => {
    if (!openItemParam) return;
    // ของชิ้นเดิมเปิดอยู่แล้วก็ไม่ต้องขอซ้ำ (เช่นตอนแถบตัวกรองเขียน URL ทับ)
    if (
      selectedItem &&
      `${selectedItem.type}-${selectedItem.id}` === openItemParam
    ) {
      return;
    }

    const [type, id] = openItemParam.split("-");
    let cancelled = false;

    (async () => {
      try {
        const res = await getInventory(id, type);
        if (cancelled || !res.data) return;
        setSelectedItem(res.data);
        setIsItemDetailOpen(true);
      } catch {
        // ของถูกลบไปแล้วหรือลิงก์เพี้ยน ก็แค่ไม่เปิดไดอะล็อก
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItemParam]);

  // ปิดไดอะล็อกแล้วต้องลบออกจาก URL ด้วย ไม่งั้นรีเฟรชหน้าหรือกดย้อนกลับมาจะเด้งขึ้นมาเอง
  const handleItemDetailOpenChange = (open) => {
    setIsItemDetailOpen(open);
    if (!open && openItemParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("item");
      setSearchParams(next, { replace: true });
    }
  };

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
            onLoadingChange={setIsListLoading}
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
        onOpenChange={handleItemDetailOpenChange}
        onStockUpdate={() => setReloadToken((n) => n + 1)}
      />
    </div>
  );
};
export default InventoryList;
