import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, Package, X } from "lucide-react";
import BillItemRows from "@/components/bill/BillItemRows";
import BillTotal from "@/components/bill/BillTotal";
import FormButton from "@/components/forms/FormButton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import EditQuantityDialog from "@/components/dialogs/EditQuantityDialog";
import EditRepairItemDialog from "@/components/dialogs/EditRepairItemDialog";
import StockPickDialog from "@/components/dialogs/StockPickDialog";
import PageSpinner from "@/components/ui/PageSpinner";
import { createShopPurchases, listOrganizationRepairs } from "@/api/customer";
import {
  PART_PLACEHOLDER_SERVICE_NAME,
  isPartPlaceholderItem,
} from "@/constants/services";
import { allowsDecimalQuantity, tracksTireLots } from "@/constants/categories";
import { getProductName } from "@/utils/billItems";
import { shopPurchaseSchema } from "@/utils/schemas";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import { toLocalDateKey } from "@/utils/date";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import {
  DRAFT_SHOP_PURCHASE,
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/utils/repairDraft";

let lastRowId = 0;
const newRowId = () => `purchase-${Date.now().toString(36)}-${++lastRowId}`;

const scrollToLastRow = () =>
  scrollToNewRow(() => {
    const rows = document.querySelectorAll("[data-repair-row]");
    return rows[rows.length - 1];
  });

// แถวหน้าตาเดียวกับบิล sellingPrice = ราคาต่อหน่วยที่ร้านค้าคิดเรา
const lineFromPart = (part) => ({
  rowId: newRowId(),
  partId: part.id,
  partNumber: part.partNumber,
  brand: part.brand,
  name: part.name,
  attributes: part.attributes,
  category: part.category,
  secureUrl: part.secureUrl,
  unit: part.unit || "",
  quantity: 1,
  // ราคาที่ร้านเราซื้อมา ใกล้เคียงที่สุดคือราคาทุน แก้ได้ถ้าร้านนี้ขายต่างไป
  sellingPrice: Math.round(Number(part.costPrice) || 0),
});

// อะไหล่อื่นๆ ไม่มีในคลัง พิมพ์ชื่อ หน่วย และราคาเอง ไม่แตะสต็อก
const customLine = () => ({
  rowId: newRowId(),
  name: PART_PLACEHOLDER_SERVICE_NAME,
  isCustom: true,
  isPartLine: true,
  isTypedUnitLine: true,
  unit: "",
  quantity: 1,
  sellingPrice: 0,
});

const toPayloadItem = (line) =>
  line.partId
    ? {
        partId: line.partId,
        quantity: line.quantity,
        unitPrice: line.sellingPrice,
      }
    : {
        // ยังเป็นชื่อตั้งต้น = ยังไม่ได้พิมพ์ชื่อ
        itemName: line.hasCustomName ? line.name : "",
        unit: line.unit.trim(),
        quantity: line.quantity,
        unitPrice: line.sellingPrice,
      };

// รับอะไหล่จากร้านค้าทีละหลายรายการแบบเปิดบิล บันทึกทั้งชุดในคราวเดียว
const ShopPurchaseCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [shop, setShop] = useState(location.state?.organization || null);
  // รีเฟรชหรือปิดแท็บแล้วกลับมา รายการที่เพิ่มไว้ยังอยู่ แบบเดียวกับร่างบิล
  const [restoredLines] = useState(
    () => loadDraft(DRAFT_SHOP_PURCHASE, id)?.lines || [],
  );
  const [lines, setLines] = useState(restoredLines);
  const [isPickOpen, setIsPickOpen] = useState(false);
  const [quantityItem, setQuantityItem] = useState(null);
  const [priceItem, setPriceItem] = useState(null);
  const [removingIndex, setRemovingIndex] = useState(null);
  const [leavingIndex, setLeavingIndex] = useState(null);
  const leaveHandledRef = useRef(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (restoredLines.length > 0) toast.info("กู้คืนข้อมูลที่กรอกค้างไว้แล้ว");
  }, [restoredLines]);

  useEffect(() => {
    if (lines.length > 0) saveDraft(DRAFT_SHOP_PURCHASE, { lines }, id);
    else clearDraft(DRAFT_SHOP_PURCHASE, id);
  }, [lines, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (shop) return;
    // เปิดหน้าตรงๆ (รีเฟรช) ไม่มีชื่อร้านติดมา
    listOrganizationRepairs(id)
      .then((res) => setShop(res.data?.customer || null))
      .catch(toastError);
  }, [id, shop]);

  const goBack = () => {
    // เปิดหน้าตรงๆ ไม่มีหน้าก่อนหน้าให้ย้อน
    if (location.key !== "default") navigate(-1);
    else navigate(`/organizations/${id}?tab=purchases`, { replace: true });
  };

  const updateLine = (index, patch) =>
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );

  const addPartLine = (part) => {
    // อะไหล่เดิมบวกจำนวนในแถวเดิม ไม่แตกแถวซ้ำ
    const index = lines.findIndex((line) => line.partId === part.id);
    if (index !== -1) {
      updateLine(index, { quantity: lines[index].quantity + 1 });
      scrollToNewRow(() =>
        document.querySelector(`[data-repair-row="${index}"]`),
      );
      return;
    }
    setLines((prev) => [...prev, lineFromPart(part)]);
    scrollToLastRow();
  };

  const handlePick = (item) => {
    setIsPickOpen(false);
    if (isPartPlaceholderItem(item)) {
      const line = customLine();
      setLines((prev) => [...prev, line]);
      // ยังไม่มีชื่อกับราคา เปิดช่องกรอกให้เลย
      setPriceItem({ index: lines.length, item: line });
      scrollToLastRow();
      return;
    }
    addPartLine(item);
  };

  // หน้าตาแถวกับไดอะล็อกยืมของบิลมา จึงต้องคืนชื่อฟังก์ชันชุดเดียวกับ useBillItems
  const bill = {
    repairItems: lines,
    itemKey: (item) => item.rowId,
    isReordering: false,
    leavingIndex,
    handleLeaveEnd: () => {
      if (leaveHandledRef.current) return;
      leaveHandledRef.current = true;
      setLines((prev) => prev.filter((_, i) => i !== leavingIndex));
      setLeavingIndex(null);
    },
    canDeferAlignment: () => false,
    setRemovingIndex,
    handleDecreaseQuantity: (index) =>
      updateLine(index, { quantity: lines[index].quantity - 1 }),
    handleIncreaseQuantity: (index) =>
      updateLine(index, { quantity: lines[index].quantity + 1 }),
    // รับของเข้า ไม่มีเพดานสต็อก
    isAtStockLimit: () => false,
    setQuantityItem,
    handleUnitChange: (index, unit) => updateLine(index, { unit }),
  };

  const allowsDecimal = (item) =>
    !!item?.isCustom ||
    (!tracksTireLots(item?.category?.name) && allowsDecimalQuantity(item));

  const total = lines.reduce(
    (sum, line) => sum + Math.round(line.quantity * line.sellingPrice),
    0,
  );

  const handleSave = async () => {
    const parsed = shopPurchaseSchema.safeParse({
      // รับของวันไหนบันทึกวันนั้น ไม่ต้องเลือกวันที่
      takenAt: toLocalDateKey(),
      items: lines.map(toPayloadItem),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast.error(issue.message);
      // แถวที่ยังไม่ครบ (อะไหล่อื่นๆ ที่ยังไม่ได้ตั้งชื่อ) เปิดช่องกรอกของแถวนั้นให้
      const index = issue.path[0] === "items" ? issue.path[1] : null;
      if (index != null && lines[index]) {
        setPriceItem({ index, item: lines[index] });
      }
      return;
    }

    setIsSaving(true);
    try {
      await withMinDuration(() => createShopPurchases(id, parsed.data));
      toast.success(`บันทึกอะไหล่ที่รับมา ${lines.length} รายการเรียบร้อยแล้ว`);
      clearDraft(DRAFT_SHOP_PURCHASE, id);
      goBack();
    } catch (error) {
      toastError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!shop) return <PageSpinner />;

  const editing = priceItem?.item;
  const removingItem = removingIndex !== null ? lines[removingIndex] : null;

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:bg-transparent xl:bg-none xl:px-4 xl:py-6 xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:mx-auto xl:w-full xl:max-w-3xl xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center justify-between gap-2 px-5 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* ร่างถูกเก็บไว้ ออกได้เลยไม่ต้องถาม กลับมาแล้วรายการยังอยู่ */}
            <button
              type="button"
              onClick={goBack}
              aria-label="กลับไปหน้ารายละเอียดร้านค้า"
              className="bg-surface/20 xl:bg-primary/10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
            >
              <ChevronLeft className="text-surface xl:hidden" />
              <ChevronLeft className="text-primary hidden xl:block" />
            </button>
            <div className="min-w-0">
              <p className="text-surface xl:text-primary truncate text-2xl leading-tight font-semibold md:text-[26px]">
                เพิ่มอะไหล่ที่รับมา
              </p>
              <p className="text-surface/80 xl:text-subtle-dark truncate text-lg font-medium md:text-xl">
                {shop.name}
              </p>
            </div>
          </div>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="text-destructive bg-surface flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-lg font-medium duration-300 md:text-xl xl:bg-transparent xl:px-0"
            >
              <X className="h-4 w-4" />
              ล้างข้อมูล
            </button>
          )}
        </div>

        <div className="bg-surface max-xl:shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:mt-0 xl:rounded-b-2xl">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Package className="text-surface h-6 w-6" />
              </div>
              <p className="text-[22px] font-semibold md:text-2xl">
                รายการอะไหล่
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPickOpen(true)}
              className="text-primary cursor-pointer text-lg font-semibold md:text-xl"
            >
              + เพิ่มอะไหล่
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="flex min-h-57 flex-1 items-center justify-center pb-23 xl:pb-0">
              <p className="text-subtle-light text-xl md:text-[22px]">
                กรุณาเพิ่มอะไหล่
              </p>
            </div>
          ) : (
            <div className="pb-23 xl:pb-4">
              <BillItemRows
                bill={bill}
                onRowClick={(index, item) => setPriceItem({ index, item })}
                transitionPrefix="purchase-item"
              />
              <BillTotal count={lines.length} total={total} />
              <div className="flex justify-center">
                <FormButton
                  label="บันทึก"
                  isLoading={isSaving}
                  onClick={handleSave}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <StockPickDialog
        isOpen={isPickOpen}
        onClose={() => setIsPickOpen(false)}
        title="เลือกอะไหล่ที่รับมา"
        onPick={handlePick}
      />
      <EditQuantityDialog
        isOpen={!!quantityItem}
        onClose={() => setQuantityItem(null)}
        onConfirm={(quantity) => updateLine(quantityItem.index, { quantity })}
        currentQuantity={quantityItem?.item?.quantity ?? 1}
        productName={getProductName(quantityItem?.item)}
        unit={quantityItem?.item?.unit || ""}
        allowDecimal={allowsDecimal(quantityItem?.item)}
      />
      <EditRepairItemDialog
        isOpen={!!priceItem}
        onClose={() => setPriceItem(null)}
        onConfirm={({ price, name }) =>
          updateLine(
            priceItem.index,
            editing?.isCustom && name !== PART_PLACEHOLDER_SERVICE_NAME
              ? { sellingPrice: price || 0, name, hasCustomName: true }
              : { sellingPrice: price || 0 },
          )
        }
        currentPrice={editing?.sellingPrice || 0}
        productName={editing ? getProductName(editing) : ""}
        partNumber={editing?.partNumber}
        productImage={editing?.secureUrl}
        isService={!!editing?.isCustom}
        currentName={editing ? getProductName(editing) : ""}
        canEditName={!!editing?.isCustom}
        isPartLine={!!editing?.isCustom}
      />
      <ConfirmDialog
        isOpen={removingIndex !== null}
        onClose={() => setRemovingIndex(null)}
        onConfirm={() => {
          leaveHandledRef.current = false;
          setLeavingIndex(removingIndex);
          setRemovingIndex(null);
        }}
        title="ยืนยันการเอารายการออก"
        requireHold={false}
        itemName={getProductName(removingItem)}
      />
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          setLines([]);
          setIsClearConfirmOpen(false);
        }}
        title="ยืนยันการล้างข้อมูล"
        requireHold={false}
        itemName={`อะไหล่ที่เพิ่มไว้ ${lines.length} รายการ`}
        confirmLabel="ล้างข้อมูล"
      />
    </div>
  );
};

export default ShopPurchaseCreate;
