import PageSpinner from "@/components/ui/PageSpinner";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  getRepair,
  updateRepairStatus,
  deleteRepair,
  cancelRepair,
} from "@/api/repair";
import { withMinDuration } from "@/utils/withMinDuration";
import { formatCurrency } from "@/utils/formats";
import {
  ChevronLeft,
  ClipboardList,
  Printer,
  LoaderCircle,
  Wrench,
  ShoppingBag,
  Trash2,
  Ban,
  ChevronRight,
} from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import { onKeyActivate } from "@/utils/a11y";
import OrganizationTypeDialog from "@/components/dialogs/OrganizationTypeDialog";
import { creditPathFor } from "@/constants/organizations";
import FormButton from "@/components/forms/FormButton";
import ReceiptPreviewDialog from "@/components/dialogs/ReceiptPreviewDialog";
import { asIssued, receiptDocNo } from "@/utils/receipt";
import { repairToForm } from "@/utils/repairForm";
import {
  DEFAULT_STATUS_INFO,
  getNextStatus,
  getNextStatusButtonClass,
  getStatusInfo,
} from "@/constants/repairStatus";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import PartPreviewDialog from "@/components/dialogs/PartPreviewDialog";
import {
  isPartLikeItem,
  isNoCategoryItem,
  hasTypedUnit,
} from "@/constants/services";
import { toast } from "sonner";
import { getInventory } from "@/api/inventory";
import { useReopenStockItem } from "@/hooks/useReopenStockItem";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import RepairDetailCustomer from "@/components/repair-detail/RepairDetailCustomer";
import RepairDetailPayment from "@/components/repair-detail/RepairDetailPayment";
import RepairDetailTimeline from "@/components/repair-detail/RepairDetailTimeline";
import RepairDetailItems from "@/components/repair-detail/RepairDetailItems";
import { toastError } from "@/utils/handleError";
import { countDisplayedItems } from "@/utils/repairItemGroups";
import { CREDIT_OPTION_ID } from "@/constants/paymentMethods";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
  getVehicleSubtitle,
} from "@/utils/repairDisplay";
import { usePrefetchPages } from "@/routes/pageImports";
import { useCreditOrganizationPrompt } from "@/hooks/useCreditOrganizationPrompt";

const RepairDetail = () => {
  usePrefetchPages(["RepairList", "RepairCreate"]);

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [repair, setRepair] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingSkip, setIsUpdatingSkip] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentMethodError, setPaymentMethodError] = useState("");
  const [isEditingPaidMethod, setIsEditingPaidMethod] = useState(false);
  const [isSavingEstimate, setIsSavingEstimate] = useState(false);
  const [isEstimateConfirmOpen, setIsEstimateConfirmOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const isCreditSelected = selectedPaymentMethod === CREDIT_OPTION_ID;
  const orgPrompt = useCreditOrganizationPrompt(repair);
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchRepairDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRepairDetail = async () => {
    setIsLoading(true);
    try {
      const res = await getRepair(id);
      setRepair(res.data);
      setSelectedPaymentMethod(res.data.paymentMethod || "");
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextStatusText = (currentStatus) => {
    switch (currentStatus) {
      case "ESTIMATE":
        return "ยืนยันการเริ่มซ่อม";
      case "IN_PROGRESS":
        return "ยืนยันการซ่อมเสร็จสิ้น";
      case "COMPLETED":
        return isCreditSelected ? "ยืนยันการลงเครดิต" : "ยืนยันการชำระเงิน";
      case "CREDIT":
        return "ยืนยันการชำระเงิน";
    }
  };

  // ส่งสถานะเดิมไปด้วย เพราะเซิร์ฟเวอร์รับเป็นคำสั่งอัปเดตสถานะตัวเดียว
  const handleChangePaidMethod = async (value) => {
    if (!repair || !value || value === repair.paymentMethod) return;

    try {
      await updateRepairStatus(repair.id, {
        status: "PAID",
        paymentMethod: value,
      });
      setRepair((prev) => ({ ...prev, paymentMethod: value }));
      setIsEditingPaidMethod(false);
      toast.success("แก้ไขวิธีชำระเงินเรียบร้อยแล้ว");
    } catch (error) {
      setSelectedPaymentMethod(repair.paymentMethod || "");
      setIsEditingPaidMethod(false);
      toastError(error);
    }
  };

  const handleSaveAsEstimate = async () => {
    if (!repair || isSavingEstimate) return;

    try {
      setIsSavingEstimate(true);
      await withMinDuration(() =>
        updateRepairStatus(repair.id, { status: "ESTIMATE" }),
      );
      setIsEstimateConfirmOpen(false);
      toast.success("บันทึกเป็นใบประเมินราคาเรียบร้อยแล้ว");
      // replace: บิลย้ายกองแล้ว กดย้อนกลับครั้งเดียวต้องถึงรายการที่มาแต่แรก
      navigate("/repairs?status=estimate", { replace: true });
    } catch (error) {
      toastError(error);
    } finally {
      setIsSavingEstimate(false);
    }
  };

  const handleUpdateStatus = async (skipToCompleted = false) => {
    if (!repair) return;

    if (skipToCompleted && isUpdatingSkip) return;
    if (!skipToCompleted && isUpdating) return;

    const nextStatus = skipToCompleted
      ? isCreditSelected
        ? "CREDIT"
        : "PAID"
      : repair.status === "COMPLETED" && isCreditSelected
        ? "CREDIT"
        : getNextStatus(repair.status);
    if (!nextStatus) return;

    const needsPaymentMethod = nextStatus === "PAID";

    if (orgPrompt.askBeforeCredit(nextStatus, skipToCompleted)) return;

    try {
      if (skipToCompleted) {
        setIsUpdatingSkip(true);
      } else {
        setIsUpdating(true);
      }

      // เซิร์ฟเวอร์ไม่บังคับวิธีชำระเงิน จึงต้องกันตรงนี้
      if (needsPaymentMethod && !selectedPaymentMethod) {
        await withMinDuration(() => Promise.resolve());
        setPaymentMethodError("กรุณาเลือกวิธีชำระเงิน");
        paymentSectionRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
        return;
      }

      const updateData = { status: nextStatus };

      if (needsPaymentMethod) {
        updateData.paymentMethod = selectedPaymentMethod;
      }

      await withMinDuration(() => updateRepairStatus(repair.id, updateData));

      if (nextStatus === "CREDIT") {
        toast.success("ลงเครดิตเรียบร้อยแล้ว");
      } else if (skipToCompleted) {
        toast.success("ซ่อมเสร็จสิ้นและชำระเงินเรียบร้อยแล้ว");
      } else if (nextStatus === "COMPLETED") {
        toast.success("ซ่อมเสร็จเรียบร้อยแล้ว");
      } else if (nextStatus === "IN_PROGRESS") {
        toast.success("เริ่มซ่อมแล้ว");
      } else if (nextStatus === "PAID") {
        toast.success("ชำระเงินเรียบร้อยแล้ว");
      }

      if (
        location.state?.from === "vehicle-detail" &&
        location.state?.vehicleId
      ) {
        navigate(`/vehicles/${location.state.vehicleId}`);
        return;
      }

      if (nextStatus === "CREDIT") {
        navigate(creditPathFor(orgPrompt.creditType()), { replace: true });
        return;
      }

      const statusSlug = nextStatus.toLowerCase().replace("_", "-");
      navigate(`/repairs?status=${statusSlug}`, { replace: true });
    } catch (error) {
      toastError(error);
    } finally {
      setIsUpdating(false);
      setIsUpdatingSkip(false);
    }
  };

  // บิลขายที่จ่ายตอนสร้าง เกิดและจบพร้อมกัน มีแค่เวลาเดียว
  const isSale = isSaleRepair(repair);
  const paidOnCreate =
    isSale &&
    !!repair?.paidAt &&
    Math.abs(new Date(repair.paidAt) - new Date(repair.createdAt)) < 60 * 1000;

  const statusInfo = getStatusInfo(repair?.status) ?? DEFAULT_STATUS_INFO;
  // บิลที่ยกเลิกยังถือเลขของใบเดิมก่อนยกเลิก
  const docNo = receiptDocNo(asIssued(repair));
  const earlierDocNos = [repair?.deliveryNo, repair?.quotationNo].filter(
    (no) => no && no !== docNo,
  );
  const StatusIcon = statusInfo?.icon;

  const handleEditRepair = () => {
    if (!repair) return;
    const { path, repairData, repairItems } = repairToForm(repair);

    navigate(path, {
      state: {
        repairData,
        repairItems,
        scrollToItems: true,
        editRepairId: repair.id,
        // หลังบันทึกถอยกลับไปหน้าที่มาแต่แรกทีเดียว
        backIdx:
          typeof window.history.state?.idx === "number"
            ? window.history.state.idx - 1
            : null,
        // ใบประเมินราคายังไม่เคยเบิกของ ห้ามบวกของในบิลคืนตอนคิดว่าเบิกได้เท่าไหร่
        stockNotDeducted: repair.status === "ESTIMATE",
        from: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
        // ต้องติดไปตลอดทางแก้ไข ไม่งั้นย้อนกลับแล้วจะเด้งไปหน้าสรุป
        returnTo: location.state?.returnTo,
        currentDate: location.state?.currentDate,
        hideMoreFields: !repairData.name?.trim(),
      },
    });
  };

  const deleteTargetName =
    repair?.status === "ESTIMATE"
      ? "ใบประเมินราคา"
      : isSaleRepair(repair)
        ? "รายการขาย"
        : "งานซ่อม";

  const confirmItemDetail =
    getRepairSubtitle(repair) === "ลูกค้าทั่วไป"
      ? ""
      : getRepairSubtitle(repair);

  // ลบได้เฉพาะบิลเลขล่าสุด บิลอื่นยกเลิกแทน เลขจะได้ไม่ขาดช่วง
  const isCancelled = repair?.status === "CANCELLED";
  const canDelete = !repair?.docNosSkippedOnDelete?.length;
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const handleCancelRepair = async () => {
    try {
      await withMinDuration(() => cancelRepair(repair.id));
      toast.success(`ยกเลิก${deleteTargetName}เรียบร้อยแล้ว`);
      setIsCancelConfirmOpen(false);
      fetchRepairDetail();
    } catch (error) {
      toastError(error);
    }
  };

  const handleDeleteRepair = async () => {
    await withMinDuration(() => deleteRepair(repair.id));
    toast.success(`ลบ${deleteTargetName}เรียบร้อยแล้ว`);
    setIsDeleteConfirmOpen(false);
    handleGoBack();
  };

  // อะไหล่อื่นๆ บริการที่พิมพ์ชื่อเอง และส่วนลด ไม่มีของในคลังให้เปิดดู
  const stockTargetOf = (item) => {
    if (item.part?.id) return { type: "part", id: item.part.id };
    if (item.service?.id && !isNoCategoryItem(item) && !hasTypedUnit(item)) {
      return { type: "service", id: item.service.id };
    }
    return null;
  };

  // ดึงข้อมูลปัจจุบันจากคลัง ไม่ใช้ของที่ติดมากับบิล เพราะสต็อกกับราคาเปลี่ยนไปแล้วได้
  const [stockItem, setStockItem] = useState(null);
  useReopenStockItem(setStockItem);
  const handleOpenStock = async (target) => {
    try {
      const res = await getInventory(target.id, target.type);
      if (!res.data) return;
      setPreviewItem(null);
      setStockItem(res.data);
    } catch (error) {
      toastError(error);
    }
  };

  // ใช้ชื่อและราคาตามที่บันทึกในบิล ไม่ใช่ของปัจจุบันในคลัง
  const toPreviewItem = (item) => ({
    name: item.itemName,
    // ชื่อในบิลถูกพิมพ์ทับได้ จึงดูจากบริการต้นทาง
    isPartLine: isPartLikeItem(item),
    category: item.part?.category || item.service?.category || null,
    partNumber: item.part?.partNumber || null,
    description: item.part?.description || item.service?.description || null,
    secureUrl: item.part?.secureUrl || item.service?.secureUrl || null,
    sellingPrice: Number(item.unitPrice),
  });

  // มาจากหน้าประวัติรถคันเดียวกันไม่ให้กดไปอีก ไม่งั้นประวัติจะซ้อนวนไปมา
  const cameFromThisVehicle =
    location.state?.from === "vehicle-detail" &&
    String(location.state?.vehicleId) === String(repair?.vehicle?.id);
  const canOpenVehicle = !!repair?.vehicle?.id && !cameFromThisVehicle;

  const handleOpenVehicle = () => {
    if (!canOpenVehicle) return;
    navigate(`/vehicles/${repair.vehicle.id}`);
  };

  // หลังกดลงเครดิตข้อมูลในมือยังเป็นสถานะเดิม กล่องจึงต้องเรียกได้ตลอด
  const hasCustomer = !!repair?.customer;
  const canSetOrganization = repair?.status === "CREDIT" && hasCustomer;

  const handleGoBack = () => {
    // เปลี่ยนประเภทระหว่างเปิดบิล = กองเดิมไม่มีบิลนี้แล้ว พาไปกองใหม่แทน
    const cameFromCreditPage =
      location.state?.from !== "vehicle-detail" && !location.state?.returnTo;

    if (
      orgPrompt.changedType() !== undefined &&
      repair?.status === "CREDIT" &&
      cameFromCreditPage
    ) {
      navigate(creditPathFor(orgPrompt.changedType()), { replace: true });
      return;
    }

    if (
      location.state?.returnTo &&
      location.state.returnTo.includes("/admin/reports/sales")
    ) {
      navigate(location.state.returnTo, {
        // สั่งไปหน้าเดิม ไม่ใช่ถอยประวัติ จึงต้องบอกเองว่าเป็นการย้อนกลับ
        state: { currentDate: location.state.currentDate, restoreScroll: true },
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={handleGoBack}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p
          className={`text-surface min-w-0 flex-1 truncate font-semibold sm:text-2xl md:text-[26px] ${
            repair?.status === "IN_PROGRESS" ? "text-xl" : "text-2xl"
          }`}
        >
          รายละเอียดการซ่อม
        </p>
        {/* รอข้อมูลก่อนค่อยขึ้นทั้งแถว ไม่งั้นปุ่มที่แทรกทีหลังจะดันปุ่มลบมาอยู่ใต้นิ้ว */}
        {!isLoading && (
          <>
            <button
              onClick={() => setIsReceiptOpen(true)}
              aria-label="พิมพ์ใบเสร็จ"
              className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
            >
              <Printer className="text-surface h-5 w-5" />
            </button>

            {/* ของที่จองไว้ในบิลจะถูกคืนเข้าคลัง */}
            {repair?.status === "IN_PROGRESS" && (
              <button
                onClick={() => setIsEstimateConfirmOpen(true)}
                disabled={isSavingEstimate}
                aria-label="บันทึกเป็นใบประเมินราคา"
                className="bg-status-estimate flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:opacity-60"
              >
                {isSavingEstimate ? (
                  <LoaderCircle className="text-surface h-5 w-5 animate-spin" />
                ) : (
                  <ClipboardList className="text-surface h-5 w-5" />
                )}
              </button>
            )}
            {canDelete ? (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                aria-label={`ลบ${deleteTargetName}`}
                className="bg-destructive flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
              >
                <Trash2 className="text-surface h-5 w-5" />
              </button>
            ) : (
              !isCancelled && (
                <button
                  onClick={() => setIsCancelConfirmOpen(true)}
                  aria-label={`ยกเลิก${deleteTargetName}`}
                  className="bg-destructive flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
                >
                  <Ban className="text-surface h-5 w-5" />
                </button>
              )
            )}
          </>
        )}
      </div>
      <div className="bg-surface shadow-primary mt-4 flex flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-4 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between gap-2 px-5">
              {docNo !== repair.id ? (
                <div className="min-w-0">
                  <p
                    className={`truncate text-[22px] leading-tight font-semibold md:text-2xl ${statusInfo.color}`}
                  >
                    {docNo}
                  </p>
                  {earlierDocNos.map((no) => (
                    <p
                      key={no}
                      className="text-subtle-dark truncate text-base leading-tight font-medium md:text-lg"
                    >
                      {no}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-[22px] leading-tight font-semibold md:text-2xl ${statusInfo.color}`}
                >
                  รหัสการซ่อม: {repair.id}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className={`rounded-full p-1 ${statusInfo.bg}`}>
                  <StatusIcon size={18} className="text-surface" />
                </div>
                <p
                  className={`text-xl font-semibold md:text-[22px] ${statusInfo.color}`}
                >
                  {statusInfo.text}
                </p>
              </div>
            </div>
            <div
              {...(canOpenVehicle
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: handleOpenVehicle,
                    onKeyDown: onKeyActivate(handleOpenVehicle),
                    "aria-label": "ดูประวัติรถคันนี้",
                    className:
                      "my-4 flex cursor-pointer items-center gap-2 px-5",
                  }
                : {
                    className: "my-4 flex items-center gap-2 px-5",
                  })}
            >
              <div
                className={`flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
              >
                {isSaleRepair(repair) ? (
                  <OutlineCardIcon
                    icon={ShoppingBag}
                    color={statusInfo.iconColor}
                  />
                ) : isNoVehicleRepair(repair) ? (
                  <OutlineCardIcon icon={Wrench} color={statusInfo.iconColor} />
                ) : (
                  <BrandIcons
                    brand={repair.vehicle?.vehicleModel?.brand}
                    color={statusInfo.iconColor}
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p
                  className={`text-[22px] font-semibold md:text-2xl ${statusInfo.color} leading-tight`}
                >
                  {getRepairTitle(repair)}
                </p>
                {!isSaleRepair(repair) && !isNoVehicleRepair(repair) && (
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {getVehicleSubtitle(repair?.vehicle)}
                  </p>
                )}
              </div>
              {canOpenVehicle && (
                <span className="bg-subtle-light/15 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <ChevronRight className="text-subtle-dark h-5 w-5" />
                </span>
              )}
            </div>
            {repair.customer && (
              <RepairDetailCustomer
                customer={repair.customer}
                statusInfo={statusInfo}
                onSetOrganization={canSetOrganization ? orgPrompt.open : null}
              />
            )}
            {repair.mileage != null && (
              <div className="mb-4 px-5">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    เลขกิโลเมตร:
                  </p>
                  <p className="text-normal text-lg font-semibold md:text-xl">
                    {Number(repair.mileage).toLocaleString()} กม.
                  </p>
                </div>
              </div>
            )}
            {repair.repairItems && (
              <RepairDetailItems
                repair={repair}
                canEdit={!isCancelled}
                onEdit={handleEditRepair}
                onItemClick={setPreviewItem}
              />
            )}
            <div
              className={`${statusInfo.softBorder} ${statusInfo.softBg} mx-5 mb-4 rounded-lg border bg-gradient-to-r p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                    รวม {countDisplayedItems(repair.repairItems)} รายการ
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p
                    className={`text-2xl font-semibold md:text-[26px] ${statusInfo.color}`}
                  >
                    {formatCurrency(Number(repair.totalPrice))}
                  </p>
                </div>
              </div>
            </div>
            {repair.description && (
              <div className="mb-4 px-5">
                <p className="text-normal mb-4 text-[22px] font-semibold md:text-2xl">
                  {isSaleRepair(repair) ? "หมายเหตุ" : "รายละเอียดการซ่อม"}
                </p>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-normal text-lg leading-relaxed font-medium md:text-xl">
                    {repair.description}
                  </p>
                </div>
              </div>
            )}
            <RepairDetailPayment
              ref={paymentSectionRef}
              repair={repair}
              statusInfo={statusInfo}
              isCancelled={isCancelled}
              isEditingPaidMethod={isEditingPaidMethod}
              onEditPaidMethod={() => setIsEditingPaidMethod(true)}
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={(value) => {
                setSelectedPaymentMethod(value);
                setPaymentMethodError("");
                if (repair.status === "PAID") handleChangePaidMethod(value);
              }}
              error={paymentMethodError}
            />
            <RepairDetailTimeline
              repair={repair}
              isSale={isSale}
              paidOnCreate={paidOnCreate}
            />
            {repair.user && (
              <div className="px-5">
                <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
                  ผู้เปิดบิล
                </p>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-normal text-lg font-medium md:text-xl">
                    {repair.user.name}
                  </p>
                </div>
              </div>
            )}
            {getNextStatus(repair.status) && (
              <div className="mt-4 flex flex-col gap-4 pr-10">
                <FormButton
                  label={getNextStatusText(repair.status)}
                  isLoading={isUpdating}
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(false)}
                  className={getNextStatusButtonClass(repair.status)}
                />
                {repair.status === "IN_PROGRESS" && (
                  <FormButton
                    label={
                      isCreditSelected
                        ? "ยืนยันการซ่อมเสร็จสิ้นและลงเครดิต"
                        : "ยืนยันการซ่อมเสร็จสิ้นและชำระเงิน"
                    }
                    isLoading={isUpdatingSkip}
                    disabled={isUpdatingSkip}
                    onClick={() => handleUpdateStatus(true)}
                    className="bg-status-paid mt-0"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <PartPreviewDialog
        part={previewItem ? toPreviewItem(previewItem) : null}
        price={previewItem ? Number(previewItem.unitPrice) : undefined}
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        onOpenStock={
          previewItem && stockTargetOf(previewItem)
            ? () => handleOpenStock(stockTargetOf(previewItem))
            : undefined
        }
      />

      <RepairItemDetailDialog
        item={stockItem}
        open={!!stockItem}
        onOpenChange={(open) => !open && setStockItem(null)}
      />

      <ReceiptPreviewDialog
        repair={repair}
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
      />

      {hasCustomer && (
        <OrganizationTypeDialog
          {...orgPrompt.dialogProps({
            onResume: handleUpdateStatus,
            onChanged: (type) => {
              // เปิดมาจากแท็บลูกค้าทั่วไป ย้ายกองแล้วบิลนี้ไม่อยู่ในแท็บเดิม พาไปแท็บใหม่ทันที
              if (
                repair?.status === "CREDIT" &&
                location.state?.statusSlug === "credit"
              ) {
                navigate(creditPathFor(type), { replace: true });
                return;
              }
              fetchRepairDetail();
            },
          })}
        />
      )}

      <ConfirmDialog
        isOpen={isEstimateConfirmOpen}
        onClose={() => setIsEstimateConfirmOpen(false)}
        onConfirm={handleSaveAsEstimate}
        title="บันทึกเป็นใบประเมินราคา"
        itemName={getRepairTitle(repair)}
        itemDetail={confirmItemDetail}
        confirmLabel="บันทึก"
        confirmClass="bg-gradient-primary"
        requireHold={false}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteRepair}
        title={`ยืนยันการลบ${deleteTargetName}`}
        itemName={getRepairTitle(repair)}
        itemDetail={confirmItemDetail}
      />

      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelRepair}
        title={`ยืนยันการยกเลิก${deleteTargetName}`}
        itemName={getRepairTitle(repair)}
        itemDetail={confirmItemDetail}
        confirmLabel="ยกเลิกบิล"
        note="ลบไม่ได้เพราะไม่ใช่บิลล่าสุด ยกเลิกแล้วเลขที่บิลยังอยู่ ของในบิลคืนเข้าสต็อก และไม่นับเป็นยอดขาย"
      />
    </div>
  );
};

export default RepairDetail;
