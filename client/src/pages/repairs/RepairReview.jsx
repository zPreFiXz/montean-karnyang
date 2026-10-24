import { useLocation, useNavigate } from "react-router";
import { hasTypedUnit } from "@/constants/services";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import {
  collapseSidePairs,
  expandBothSides,
  groupBySidePairs,
  isSuspensionTabItem,
  mergeSidesInOrder,
} from "@/utils/repairItemGroups";
import { useEffect, useState } from "react";
import BillTotal from "@/components/bill/BillTotal";
import FormButton from "@/components/forms/FormButton";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { formatPhone, getProvinceName } from "@/utils/formats";
import { createRepair, updateRepair } from "@/api/repair";
import { clearAllDrafts } from "@/utils/repairDraft";
import { toast } from "sonner";
import {
  Edit,
  ChevronLeft,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  Wrench,
  ClipboardList,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import ComboBox from "@/components/ui/ComboBox";
import PartPreviewDialog from "@/components/dialogs/PartPreviewDialog";
import {
  PAYMENT_OPTIONS_WITH_CREDIT,
  CREDIT_OPTION_ID,
} from "@/constants/paymentMethods";
import { usePrefetchPages } from "@/routes/pageImports";
import { withViewTransition } from "@/utils/viewTransition";
import { getDisplayBrand } from "@/utils/repairDisplay";

// อะไหล่จากแท็บทั้งหมดเป็นก้อนเดียว รายการซ่อมเพิ่มเติมเป็นก้อนละรายการ
// ไม่มีช่องลำดับในฐานข้อมูล ลำดับบรรทัดที่ส่งไปคือตัวบันทึก
const buildUnits = (items = []) => {
  const units = [];
  let extras = [];
  const flushExtras = () => {
    for (const item of collapseSidePairs(extras)) {
      units.push({
        type: "extra",
        item,
        key: item.rowId || `extra-${units.length}`,
      });
    }
    extras = [];
  };

  for (const item of items) {
    if (!isSuspensionTabItem(item)) {
      extras.push(item);
    } else if (!units.some((unit) => unit.type === "tab")) {
      flushExtras();
      units.push({ type: "tab", key: "tab" });
    }
  }
  flushExtras();
  return units;
};

const SIDE_BADGE = { both: "L-R", left: "L", right: "R" };

const RepairReview = () => {
  usePrefetchPages(["RepairList", "RepairDetail"]);

  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const { repairData, repairItems, editRepairId } = location.state || {};
  const origin = location.state?.origin || location.state?.from;
  const statusSlug = location.state?.statusSlug;
  const returnTo = location.state?.returnTo;
  const currentDate = location.state?.currentDate;
  const vehicleId = location.state?.vehicleId;
  const backIdx = location.state?.backIdx;
  const isSale = repairData?.type === "SALE";
  const hasNoVehicle = isSale || !!repairData?.noVehicle;
  // ไม่ตั้งค่าเริ่มต้นเป็นเงินสด ไม่งั้นกดยืนยันผ่านไป บิลที่รับเงินทางอื่นจะกลายเป็นเงินสด
  const [paymentMethod, setPaymentMethod] = useState(
    repairData?.paymentMethod || "",
  );

  const isSuspensionBill = location.state?.from === "suspension";
  const tabItems =
    isSuspensionBill && repairItems
      ? repairItems.filter(isSuspensionTabItem)
      : [];
  const [units, setUnits] = useState(() => buildUnits(repairItems));
  const [isReordering, setIsReordering] = useState(false);
  const orderedItems = isSuspensionBill
    ? expandBothSides(
        units.flatMap((unit) => (unit.type === "tab" ? tabItems : [unit.item])),
      )
    : repairItems;
  const extraUnits = units.filter((unit) => unit.type === "extra");

  const reviewTitle = isSale
    ? "สรุปขายอะไหล่"
    : hasNoVehicle
      ? "สรุปงานบริการ"
      : repairData?.type === "SUSPENSION"
        ? "สรุปเช็กช่วงล่าง"
        : "สรุปงานซ่อม";

  const isCreditChoice = isSale && paymentMethod === CREDIT_OPTION_ID;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!repairData || !repairItems) {
      navigate("/repairs/new", { replace: true });
    }
  }, [repairData, repairItems, navigate]);

  if (!repairData || !repairItems) {
    return null;
  }

  const hasCustomerInfo = Boolean(
    repairData.name ||
    repairData.address ||
    repairData.phoneNumber ||
    repairData.taxId,
  );

  const totalPrice = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0,
  );

  const getItemsBySide = (side) => {
    return tabItems.filter((item) => item.side === side);
  };

  const { bothSides, leftOnly, rightOnly } = isSuspensionBill
    ? groupBySidePairs(getItemsBySide("left"), getItemsBySide("right"))
    : { bothSides: [], leftOnly: [], rightOnly: [] };
  const otherItems = isSuspensionBill ? getItemsBySide("other") : [];
  const generalRows = isSuspensionBill
    ? extraUnits.map(({ item }) => ({
        item,
        sideLabel: SIDE_BADGE[item.side] || "",
      }))
    : mergeSidesInOrder(repairItems);

  const displayedItemCount =
    bothSides.length +
    leftOnly.length +
    rightOnly.length +
    otherItems.length +
    generalRows.length;

  const confirmLabel = editRepairId
    ? "บันทึก"
    : isSale
      ? isCreditChoice
        ? "ขายและลงเครดิต"
        : "ขายและรับเงิน"
      : "สร้างงานซ่อม";

  const handleConfirmRepair = async () => {
    if (isSale && !paymentMethod) {
      toast.error("กรุณาเลือกวิธีชำระเงิน");
      return;
    }

    setIsSubmitting(true);
    try {
      const repair = {
        name: repairData.name,
        address: repairData.address,
        taxId: repairData.taxId,
        phoneNumber: repairData.phoneNumber,
        brand: repairData.brand,
        model: repairData.model,
        // ต้องตรงกับที่ RepairDetail แยกกลับตอนกดแก้ไข
        plate: `${repairData.plateLetters} ${repairData.plateNumbers}`,
        province: getProvinceName(repairData.province),
        fleetNo: repairData.fleetNo?.trim() || "",
        description: repairData.description,
        ...(repairData.mileage ? { mileage: Number(repairData.mileage) } : {}),
        totalPrice: totalPrice,
        type: repairData.type,
        ...(repairData.noVehicle ? { noVehicle: true } : {}),
        ...(isSale ? { paymentMethod } : {}),
        repairItems: expandBothSides(orderedItems).map((item) => {
          // ดูแค่รหัสอะไหล่ ยางเปอร์เซ็นต์ไม่มียี่ห้อ ถ้าเช็กยี่ห้อด้วยจะถูกส่งเป็นบริการแล้วบันทึกไม่ผ่าน
          const isPart = !!item.partNumber;
          return {
            ...(isPart ? { partId: item.id } : { serviceId: item.id }),
            // ชื่อที่พิมพ์เองต้องส่งไป ไม่งั้นเซิร์ฟเวอร์ประกอบชื่อจากคลังทับ
            // อะไหล่ที่ไม่ได้แก้ชื่อปล่อยให้เซิร์ฟเวอร์ประกอบ เพราะชื่อบนการ์ดไม่มียี่ห้อกับขนาดยาง
            ...(!item.name || (isPart && !item.hasCustomName)
              ? {}
              : { itemName: item.name }),
            // อะไหล่กับบริการปกติดึงหน่วยจากคลังตอนแสดงผล
            ...(hasTypedUnit(item) && item.unit ? { itemUnit: item.unit } : {}),
            unitPrice: Number(item.sellingPrice),
            quantity: item.quantity,
            ...(item.side ? { side: item.side } : {}),
          };
        }),
      };

      if (editRepairId) {
        await withMinDuration(() => updateRepair(editRepairId, repair));
        clearAllDrafts();
        toast.success("แก้ไขงานซ่อมเรียบร้อยแล้ว");
        // ถอยประวัติกลับไปหน้าบิล ไม่ซ้อนหน้าใหม่ ไม่งั้นหน้ากรอกกับหน้าสรุปจะค้างอยู่ในประวัติ
        // (หน้าบิลอยู่ถัดจาก backIdx หนึ่งขั้นเสมอ)
        const currentIdx = window.history.state?.idx;
        const targetIdx = backIdx + 1;
        if (
          typeof backIdx === "number" &&
          typeof currentIdx === "number" &&
          targetIdx >= 0 &&
          targetIdx < currentIdx
        ) {
          navigate(targetIdx - currentIdx);
        } else {
          // ไม่รู้ตำแหน่งในประวัติ เปิดหน้าบิลใหม่แทนการเดาว่าต้องถอยกี่หน้า
          navigate(`/repairs/${editRepairId}`, {
            replace: true,
            state: { returnTo, currentDate },
          });
        }
      } else {
        await withMinDuration(() => createRepair(repair));
        clearAllDrafts();
        toast.success(
          isCreditChoice
            ? "ขายเรียบร้อยแล้ว ลงเครดิตไว้"
            : isSale
              ? "ขายเรียบร้อยแล้ว"
              : "สร้างงานซ่อมเรียบร้อยแล้ว",
        );
        const isDesktop = window.innerWidth >= 1280;
        if (isDesktop) {
          navigate("/");
        } else {
          navigate(
            isCreditChoice
              ? "/organizations?type=general"
              : isSale
                ? "/repairs?status=paid"
                : "/repairs?status=in-progress",
          );
        }
      }
    } catch (error) {
      toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = (scrollToItems = false) => {
    const from = location.state?.from;
    const backState = {
      repairData,
      repairItems: orderedItems,
      scrollToItems,
      editRepairId,
      stockNotDeducted: location.state?.stockNotDeducted,
      // ต้องติดไปทุกครั้ง ไม่งั้นบันทึกรอบถัดไปจะไม่รู้ว่าต้องถอยกลับไปที่ไหน
      backIdx,
      origin,
      statusSlug,
      vehicleId,
      returnTo,
      currentDate,
      ...(!repairData.name || !repairData.name.trim()
        ? { hideMoreFields: true }
        : {}),
    };

    if (from === "suspension") {
      navigate("/inspections/suspension", { state: backState, replace: true });
    } else {
      navigate("/repairs/new", { state: backState, replace: true });
    }
  };

  const renderCard = (item, sideLabel, key, rightSlot) => (
    <RepairItemCard
      key={key}
      item={item}
      variant="summary"
      sideLabel={sideLabel}
      rightSlot={rightSlot}
      onClick={() => !isReordering && setPreviewItem(item)}
    />
  );

  const renderGroup = (
    Icon,
    title,
    items,
    sideLabel,
    keyPrefix,
    headerRight,
  ) => (
    <div key={keyPrefix} className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-primary flex items-center gap-1 text-xl font-semibold md:text-[22px]">
          <Icon className="mt-0.5" />
          {title}
        </p>
        {headerRight}
      </div>
      <div className="space-y-3">
        {items.map((item, index) =>
          renderCard(item, sideLabel, `${keyPrefix}-${index}`),
        )}
      </div>
    </div>
  );

  // ลูกศรของทั้งก้อนอยู่ที่หัวข้อแรก เพราะการ์ดในก้อนย้ายแยกกันไม่ได้
  const renderTabGroups = (headerRight) =>
    [
      [ArrowLeftRight, "รายการซ่อมข้างซ้าย-ขวา", bothSides, "L-R", "both"],
      [ArrowLeft, "รายการซ่อมข้างซ้าย", leftOnly, "L", "left"],
      [ArrowRight, "รายการซ่อมข้างขวา", rightOnly, "R", "right"],
      [Ellipsis, "รายการซ่อมอื่นๆ", otherItems, undefined, "other"],
    ]
      .filter(([, , items]) => items.length > 0)
      .map((group, index) =>
        renderGroup(...group, index === 0 ? headerRight : null),
      );

  const handleMoveUnit = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= units.length) return;
    withViewTransition(() =>
      setUnits((prev) => {
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      }),
    );
  };

  const renderMoveButtons = (index) => (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleMoveUnit(index, -1);
        }}
        disabled={index === 0}
        aria-label="เลื่อนขึ้น"
        className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleMoveUnit(index, 1);
        }}
        disabled={index === units.length - 1}
        aria-label="เลื่อนลง"
        className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );

  const renderSuspensionUnits = (variant) =>
    units.map((unit, index) => {
      const startsExtras =
        unit.type === "extra" &&
        (index === 0 || units[index - 1].type !== "extra");
      return (
        <div key={unit.key}>
          {startsExtras && (
            <p className="text-primary mb-2 flex items-center gap-1 text-xl font-semibold md:text-[22px]">
              <Wrench className="mb-0.5 inline" />
              รายการซ่อมเพิ่มเติม
            </p>
          )}
          <div
            style={{ viewTransitionName: `review-${variant}-${unit.key}` }}
            className={
              unit.type === "tab"
                ? isReordering
                  ? "mb-4 rounded-lg border border-gray-200 px-2 pt-2"
                  : ""
                : "mb-3"
            }
          >
            {unit.type === "tab"
              ? renderTabGroups(isReordering && renderMoveButtons(index))
              : renderCard(
                  unit.item,
                  SIDE_BADGE[unit.item.side],
                  unit.key,
                  isReordering ? renderMoveButtons(index) : undefined,
                )}
          </div>
        </div>
      );
    });

  const renderGeneralRows = () =>
    generalRows.length > 0 && (
      <div className="mb-4 space-y-3">
        {generalRows.map(({ item, sideLabel }, index) =>
          renderCard(item, sideLabel, `general-${index}`),
        )}
      </div>
    );

  const renderItemList = (variant) =>
    isSuspensionBill ? renderSuspensionUnits(variant) : renderGeneralRows();

  const reorderButton = isSuspensionBill && units.length > 1 && (
    <button
      type="button"
      onClick={() => setIsReordering((prev) => !prev)}
      aria-pressed={isReordering}
      aria-label={isReordering ? "ออกจากโหมดจัดเรียง" : "จัดเรียงรายการซ่อม"}
      className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border duration-300 ${
        isReordering
          ? "bg-primary border-primary text-surface"
          : "text-subtle-dark border-gray-200 bg-gray-100"
      }`}
    >
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-4 xl:bg-transparent xl:px-4 xl:pt-6 xl:pb-6 xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center gap-2 px-5 pt-4">
          <button
            onClick={() => handleGoBack()}
            className="bg-surface/20 xl:bg-primary/10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
          >
            <ChevronLeft className="text-surface xl:hidden" />
            <ChevronLeft className="text-primary hidden xl:block" />
          </button>
          <div>
            <p className="text-surface xl:text-primary text-2xl font-semibold md:text-[26px]">
              {reviewTitle}
            </p>
          </div>
        </div>

        <div className="bg-surface mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-4 xl:mt-0 xl:rounded-none xl:bg-transparent xl:shadow-none">
          <div className="px-5">
            {hasCustomerInfo && (
              <div className="mb-4">
                <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
                  ข้อมูลลูกค้า
                </p>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ชื่อลูกค้า:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.name || "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ที่อยู่:
                    </p>
                    <p className="text-normal max-w-62.5 text-right text-lg font-semibold break-words md:text-xl">
                      {repairData.address || "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      เบอร์โทรศัพท์:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.phoneNumber
                        ? formatPhone(repairData.phoneNumber)
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                  {repairData.taxId && (
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        เลขประจำตัวผู้เสียภาษีอากร:
                      </p>
                      <p className="text-normal ml-auto text-lg font-semibold text-nowrap md:text-xl">
                        {repairData.taxId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!hasNoVehicle && (
              <div className="mb-4">
                <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
                  ข้อมูลรถยนต์
                </p>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ยี่ห้อ-รุ่น:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {getDisplayBrand({
                        brand: repairData.brand,
                        model: repairData.model,
                      })}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ทะเบียนรถ:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.plateLetters &&
                      repairData.plateNumbers &&
                      getProvinceName(repairData.province)
                        ? `${repairData.plateLetters}-${
                            repairData.plateNumbers
                          } ${getProvinceName(repairData.province)}`
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                  {repairData.fleetNo?.trim() && (
                    <div className="flex justify-between">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        เบอร์รถ:
                      </p>
                      <p className="text-normal text-lg font-semibold md:text-xl">
                        {repairData.fleetNo.trim()}
                      </p>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <p className="text-subtle-dark flex-shrink-0 text-lg font-medium md:text-xl">
                      เลขกิโลเมตร:
                    </p>
                    <p className="text-normal min-w-0 text-right text-lg leading-relaxed font-semibold break-words md:text-xl">
                      {repairData.mileage
                        ? `${Number(repairData.mileage).toLocaleString()} กม.`
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {repairData.description && (
              <div className="mb-4">
                <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
                  {isSale ? "หมายเหตุ" : "รายละเอียดการซ่อม"}
                </p>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-normal text-lg leading-relaxed font-medium break-words md:text-xl">
                    {repairData.description}
                  </p>
                </div>
              </div>
            )}

            {isSale && (
              <div className="mb-4">
                <ComboBox
                  label="วิธีชำระเงิน"
                  color="text-subtle-dark"
                  options={PAYMENT_OPTIONS_WITH_CREDIT}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  placeholder="-- เลือกวิธีชำระเงิน --"
                  name="paymentMethod"
                />
              </div>
            )}
          </div>

          <div className="xl:hidden">
            <div className="mb-4">
              <div className="mb-4 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <p className="text-[22px] font-semibold md:text-2xl">
                    รายการซ่อม
                  </p>
                  {reorderButton}
                </div>
                <button
                  onClick={() => handleGoBack(true)}
                  className="text-primary flex cursor-pointer items-center gap-1 text-xl font-semibold md:text-[22px]"
                >
                  <Edit className="h-5 w-5" />
                  แก้ไขรายการซ่อม
                </button>
              </div>
              <div className="px-5">{renderItemList("m")}</div>
            </div>

            <BillTotal count={displayedItemCount} total={totalPrice} />
            <div className="flex justify-center pb-28">
              <FormButton
                label={confirmLabel}
                isLoading={isSubmitting}
                onClick={handleConfirmRepair}
              />
            </div>
          </div>

          <div className="hidden pb-6 xl:block" />
        </div>
      </div>

      <div className="hidden w-1/2 xl:block">
        <div className="bg-surface shadow-primary h-fit rounded-2xl">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <ClipboardList className="text-primary h-5 w-5" />
              </div>
              <p className="text-[22px] font-semibold md:text-2xl">
                รายการซ่อม
              </p>
              {reorderButton}
            </div>
            <button
              onClick={() => handleGoBack(true)}
              className="text-primary flex cursor-pointer items-center gap-1 text-xl font-semibold md:text-[22px]"
            >
              <Edit className="h-5 w-5" />
              แก้ไขรายการซ่อม
            </button>
          </div>
          <div className="px-5 pt-4">{renderItemList("d")}</div>

          <BillTotal count={displayedItemCount} total={totalPrice} />
          <div className="flex justify-center pb-4">
            <FormButton
              label={confirmLabel}
              isLoading={isSubmitting}
              onClick={handleConfirmRepair}
            />
          </div>
        </div>
      </div>
      <PartPreviewDialog
        part={
          previewItem
            ? {
                ...previewItem,
                sellingPrice: previewItem.basePrice ?? previewItem.sellingPrice,
              }
            : null
        }
        price={previewItem?.sellingPrice}
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      />
    </div>
  );
};

export default RepairReview;
