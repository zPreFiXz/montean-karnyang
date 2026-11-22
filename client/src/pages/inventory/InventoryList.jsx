import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { ArrowUpDown, ClipboardCheck } from "lucide-react";
import { getInventory } from "@/api/inventory";
import InventoryBrowser from "@/components/inventory/InventoryBrowser";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import { BoxSearch } from "@/components/icons/Icons";
import { SERVICE_CATEGORY } from "@/constants/categories";
import {
  inventoryScrollKey,
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";
import { usePrefetchPages } from "@/routes/pageImports";

const InventoryList = () => {
  usePrefetchPages(["InventoryForm", "InventoryUsage"]);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [selectedItem, setSelectedItem] = useState(
    location.state?.openItem ?? null,
  );
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(
    !!location.state?.openItem,
  );
  // เพิ่งเพิ่มชิ้นนี้ ปิดไดอะล็อกแล้วเลื่อนไปให้เห็นในรายการพร้อมไฮไลต์สั้นๆ
  const highlightKeyRef = useRef(
    location.state?.highlightItem && location.state?.openItem
      ? `${location.state.openItem.type}-${location.state.openItem.id}`
      : null,
  );

  const [highlightedItem, setHighlightedItem] = useState(null);

  // เปลี่ยนค่านี้เพื่อสั่งให้รายการโหลดใหม่หลังแก้สต็อกจากไดอะล็อก
  const [reloadToken, setReloadToken] = useState(0);

  const activeCategory = searchParams.get("category");
  const [isListLoading, setIsListLoading] = useState(true);

  // จำตำแหน่งระหว่างเลื่อน แทนการวัดตอนกดปุ่ม ซึ่งไดอะล็อกที่กำลังปิดจะทำให้วัดได้ 0
  useScrollTracking(inventoryScrollKey(activeCategory));
  useScrollRestoration(inventoryScrollKey(activeCategory), !isListLoading);

  // ไดอะล็อกต้องเปิดค้างไว้เมื่อกดย้อนกลับมา จึงจำไว้ใน URL (item=part-43)
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

  // ไม่ลบออกจาก URL รีเฟรชหรือย้อนกลับมาจะเด้งขึ้นมาเอง
  const handleItemDetailOpenChange = (open) => {
    setIsItemDetailOpen(open);
    const highlightKey = highlightKeyRef.current;
    if (!open && highlightKey) {
      highlightKeyRef.current = null;
      // รอไดอะล็อกปิดเสร็จก่อน ไม่งั้นหน้ายังถูกล็อกการเลื่อนอยู่
      setTimeout(() => {
        const card = document.querySelector(
          `[data-inventory-item="${highlightKey}"]`,
        );
        if (!card) return;
        // ไฮไลต์ตอนเลื่อนถึงแล้ว ไม่งั้นรายการยาวไฮไลต์หมดก่อนการ์ดขึ้นจอ
        // เบราว์เซอร์ที่ไม่มี scrollend หรือไม่ต้องเลื่อนเลย ใช้เวลาสำรองแทน
        let done = false;
        const highlight = () => {
          if (done) return;
          done = true;
          window.removeEventListener("scrollend", highlight);
          setHighlightedItem(highlightKey);
          setTimeout(() => setHighlightedItem(null), 1500);
        };
        window.addEventListener("scrollend", highlight, { once: true });
        const before = window.scrollY;
        card.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(() => {
          if (window.scrollY === before) highlight();
        }, 100);
        setTimeout(highlight, 1500);
      }, 350);
    }
    if (!open && openItemParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("item");
      setSearchParams(next, { replace: true });
    }
  };

  // ข้อมูลหลังแก้ติดมากับ state ล้าง state ทันที ไม่งั้นย้อนกลับมาอีกครั้งไดอะล็อกจะเด้งซ้ำ
  useEffect(() => {
    if (location.state?.openItem) {
      window.history.replaceState(null, document.title, window.location.href);
    }
  }, [location.state]);

  return (
    <div className="bg-gradient-primary shadow-primary desktop-column flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <div className="bg-surface/20 flex h-10 w-10 items-center justify-center rounded-full">
          <BoxSearch color="#ffffff" />
        </div>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          อะไหล่และบริการ
        </p>
        <Link
          to="/inventory/review"
          aria-label="รายการที่ต้องตรวจสอบ"
          title="รายการที่ต้องตรวจสอบ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <ClipboardCheck className="text-surface h-5 w-5" />
        </Link>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        <div className="flex flex-1 flex-col px-5 pt-4">
          <InventoryBrowser
            syncUrl
            highlightedItem={highlightedItem}
            reloadToken={reloadToken}
            onLoadingChange={setIsListLoading}
            onItemClick={(item) => {
              setSelectedItem(item);
              setIsItemDetailOpen(true);
            }}
            titleActionFor={(category) =>
              category === SERVICE_CATEGORY && (
                <Link
                  to="/inventory/service-order"
                  aria-label="เรียงลำดับบริการ"
                  title="เรียงลำดับบริการ"
                  className="text-primary bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <ArrowUpDown className="h-4.5 w-4.5" />
                </Link>
              )
            }
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
