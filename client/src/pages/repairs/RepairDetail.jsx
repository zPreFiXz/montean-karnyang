import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { getRepair, updateRepairStatus, deleteRepair } from "@/api/repair";
import { withMinDuration } from "@/utils/withMinDuration";
import {
  formatDate,
  formatTime,
  formatCurrency,
  formatPhone,
} from "@/utils/formats";
import {
  ChevronLeft,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  LoaderCircle,
  CircleUserRound,
  MapPin,
  Phone,
  Edit,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  CircleEllipsis,
  Wrench,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import FormButton from "@/components/forms/FormButton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import ComboBox from "@/components/ui/ComboBox";
import { isPartPlaceholderItem } from "@/constants/services";
import FieldErrorList from "@/components/forms/FieldErrorList";
import { toast } from "sonner";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { toastError } from "@/utils/handleError";
import { groupBySidePairs } from "@/utils/repairItemGroups";
import { isPerSide } from "@/utils/suspension";
import {
  PAYMENT_METHODS,
  PAYMENT_OPTIONS_WITH_CREDIT,
  CREDIT_OPTION_ID,
  getPaymentMethodText,
} from "@/constants/paymentMethods";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [repair, setRepair] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingSkip, setIsUpdatingSkip] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  // ช่องที่ยังไม่ได้เลือกขึ้นกรอบแดงใต้ช่องเหมือนฟอร์มอื่นในระบบ ไม่ใช่เด้งข้อความแล้วหายไป
  const [paymentMethodError, setPaymentMethodError] = useState("");
  const isCreditSelected = selectedPaymentMethod === CREDIT_OPTION_ID;
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchRepairDetail();
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

  const DEFAULT_STATUS_INFO = {
    text: "ไม่ทราบสถานะ",
    color: "text-subtle-dark",
    bg: "bg-gray-200",
    // สีจางสำหรับพื้นกับขอบของกล่องยอดรวม
    softBorder: "border-gray-300",
    softBg: "from-gray-200/60 to-gray-100/40",
    iconColor: "#6b7280",
    icon: CircleEllipsis,
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return {
          text: "กำลังซ่อม",
          color: "text-status-progress",
          bg: "bg-status-progress",
          softBorder: "border-status-progress/30",
          softBg: "from-status-progress/10 to-status-progress/5",
          iconColor: "#ffb000",
          icon: Clock,
        };
      case "COMPLETED":
        return {
          text: "ซ่อมเสร็จสิ้น",
          color: "text-status-completed",
          bg: "bg-status-completed",
          softBorder: "border-status-completed/30",
          softBg: "from-status-completed/10 to-status-completed/5",
          iconColor: "#22c55e",
          icon: CheckCircle2,
        };
      case "CREDIT":
        return {
          text: "เครดิต",
          color: "text-status-credit",
          bg: "bg-status-credit",
          softBorder: "border-status-credit/30",
          softBg: "from-status-credit/10 to-status-credit/5",
          iconColor: "#7c3aed",
          icon: Wallet,
        };
      case "PAID":
        return {
          text: "ชำระเงินแล้ว",
          color: "text-status-paid",
          bg: "bg-status-paid",
          softBorder: "border-status-paid/30",
          softBg: "from-status-paid/10 to-status-paid/5",
          iconColor: "#1976d2",
          icon: CreditCard,
        };
    }
    return DEFAULT_STATUS_INFO;
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "IN_PROGRESS":
        return "COMPLETED";
      case "COMPLETED":
      case "CREDIT":
        return "PAID";
    }
  };

  // ปุ่มบอกสิ่งที่จะเกิดขึ้นจริง เลือกเครดิตไว้แล้วกดปุ่มนี้คือยังไม่ได้เก็บเงิน
  // ถ้าปล่อยให้เขียนว่าชำระเงินเหมือนเดิม คนกดจะเข้าใจว่าเก็บเงินไปแล้ว
  const getNextStatusText = (currentStatus) => {
    switch (currentStatus) {
      case "IN_PROGRESS":
        return "ยืนยันการซ่อมเสร็จสิ้น";
      case "COMPLETED":
        return isCreditSelected ? "ยืนยันการลงเครดิต" : "ยืนยันการชำระเงิน";
      case "CREDIT":
        return "ยืนยันการชำระเงิน";
    }
  };

  const getNextStatusButtonClass = (currentStatus) => {
    switch (currentStatus) {
      case "IN_PROGRESS":
        return "bg-status-completed";
      case "COMPLETED":
      case "CREDIT":
        return "bg-status-paid";
    }
  };

  const handleUpdateStatus = async (skipToCompleted = false) => {
    if (!repair) return;

    if (skipToCompleted && isUpdatingSkip) return;
    if (!skipToCompleted && isUpdating) return;

    // เลือกเครดิตมีผลเฉพาะจังหวะที่กำลังจะเก็บเงิน
    // ปุ่มยืนยันการซ่อมเสร็จสิ้นของบิลที่ยังซ่อมอยู่ ยังเดินไปสถานะซ่อมเสร็จสิ้นตามปกติ
    const nextStatus = skipToCompleted
      ? isCreditSelected
        ? "CREDIT"
        : "PAID"
      : repair.status === "COMPLETED" && isCreditSelected
        ? "CREDIT"
        : getNextStatus(repair.status);
    if (!nextStatus) return;

    const needsPaymentMethod = nextStatus === "PAID";

    try {
      if (skipToCompleted) {
        setIsUpdatingSkip(true);
      } else {
        setIsUpdating(true);
      }

      // ไม่เลือกวิธีชำระเงินแล้วปิดบิลไปเลยได้ ยอดจะไปโผล่ในรายงานโดยไม่รู้ว่ารับเงินมาทางไหน
      // เซิร์ฟเวอร์ปล่อยผ่านเพราะเก็บเฉพาะตอนที่ส่งค่ามา จึงต้องกันตั้งแต่ตรงนี้
      //
      // หน่วงเท่าจังหวะบันทึกจริงก่อนค่อยเตือน ปุ่มจะได้หมุนเหมือนกดครั้งอื่น
      // ไม่ใช่เด้งเตือนทันทีจนไม่แน่ใจว่ากดติดหรือระบบไม่ทำงาน
      if (needsPaymentMethod && !selectedPaymentMethod) {
        await withMinDuration(() => Promise.resolve());
        setPaymentMethodError("กรุณาเลือกวิธีชำระเงิน");
        // ปุ่มอยู่ล่างสุดของหน้า ถ้าไม่พาไปหาช่องก็จะไม่เห็นว่าติดตรงไหน
        paymentSectionRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
        return;
      }

      const updateData = { status: nextStatus };

      // สถานะเครดิตไม่ส่งวิธีชำระเงินไป เพราะยังไม่รู้ว่าลูกค้าจะจ่ายทางไหนตอนมาตัดเครดิต
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
      } else if (nextStatus === "PAID") {
        toast.success("ชำระเงินเรียบร้อยแล้ว");
      }

      // เปิดบิลมาจากหน้าประวัติรถ ให้กลับไปที่รถคันนั้น ไม่ใช่โยนไปแท็บสถานะที่ไม่ได้มาจากตรงนั้น
      if (
        location.state?.from === "vehicle-detail" &&
        location.state?.vehicleId
      ) {
        navigate(`/vehicles/${location.state.vehicleId}`);
        return;
      }

      const statusSlug = nextStatus.toLowerCase().replace("_", "-");
      navigate(`/repairs?status=${statusSlug}`);
    } catch (error) {
      toastError(error);
    } finally {
      setIsUpdating(false);
      setIsUpdatingSkip(false);
    }
  };

  // บิลขายหน้าร้านเก็บเงินตอนสร้างบิล เวลาทั้งสามช่วงจึงเป็นวินาทีเดียวกัน
  // งานบริการเดินสถานะปกติ จึงมีเวลาแยกแต่ละช่วงเหมือนงานซ่อม
  const paidOnCreate = isSaleRepair(repair);

  const statusInfo = getStatusInfo(repair?.status) ?? DEFAULT_STATUS_INFO;
  const StatusIcon = statusInfo?.icon;

  // DB เก็บ side เป็นตัวพิมพ์ใหญ่ (enum LEFT/RIGHT/OTHER) — แปลงเป็นตัวเล็กให้ตรง UI state
  const toUiSide = (side) => (side ? side.toLowerCase() : null);

  const handleEditRepair = () => {
    if (!repair) return;

    const plate = repair?.vehicle?.licensePlate?.plateNumber || "";
    // รองรับขีดด้วยเผื่อมีข้อมูลที่บันทึกด้วยรูปแบบเดิมหลงเหลืออยู่
    const [plateLetters = "", plateNumbers = ""] = plate.split(/[\s-]+/);
    const provinceName = repair?.vehicle?.licensePlate?.province || "";

    const repairData = {
      name: repair?.customer?.name || "",
      address: repair?.customer?.address || "",
      phoneNumber: repair?.customer?.phoneNumber || "",
      brand: repair?.vehicle?.vehicleModel?.brand || "",
      model: repair?.vehicle?.vehicleModel?.model || "",
      plateLetters,
      plateNumbers,
      // ฟอร์มงานซ่อมเก็บจังหวัดเป็นชื่อ ไม่ใช่ id — ส่ง id ไปดรอปดาวน์จะหาค่าไม่เจอแล้วช่องว่าง
      province: provinceName,
      description: repair?.description || "",
      mileage: repair?.mileage != null ? String(repair.mileage) : "",
      type: repair?.type || "GENERAL",
      // บิลที่ไม่ได้ผูกกับรถ (งานบริการ) ต้องกลับเข้าโหมดเดิม ไม่งั้นจะถูกบังคับให้เลือกรถ
      noVehicle: !repair?.vehicle,
    };

    const usedQtyByPartId = (repair?.repairItems || []).reduce((acc, ri) => {
      if (ri.part?.id) {
        acc[ri.part.id] = (acc[ri.part.id] || 0) + (ri.quantity || 1);
      }
      return acc;
    }, {});

    const normalizedItems = (repair?.repairItems || []).map((ri) => {
      if (ri.part) {
        const baseStock = ri.part.stockQuantity ?? 0;
        const restoredStock = baseStock + (usedQtyByPartId[ri.part.id] || 0);
        return {
          id: ri.part.id,
          partNumber: ri.part.partNumber,
          brand: ri.part.brand || "",
          name: ri.part.name || "",
          sellingPrice: Number(ri.unitPrice),
          stock: restoredStock,
          unit: ri.part.unit,
          category: ri.part.category,
          secureUrl: ri.part.secureUrl || null,
          attributes: ri.part.attributes || null,
          quantity: ri.quantity || 1,
          side: toUiSide(ri.side),
        };
      }
      return {
        id: ri.service?.id,
        brand: "",
        // ชื่อที่บันทึกไว้มาก่อน เพราะบริการอย่างค่าแรงพิมพ์ชื่อเองได้
        name: ri.itemName || ri.service?.name || "",
        // ชื่อบนบรรทัดถูกพิมพ์ทับไปแล้ว ดูจากชื่อบริการต้นทางว่าเป็นบรรทัดอะไหล่ไหม
        isPartLine: isPartPlaceholderItem(ri),
        sellingPrice: Number(ri.unitPrice),
        category: ri.service?.category,
        secureUrl: null,
        quantity: ri.quantity || 1,
        side: toUiSide(ri.side),
      };
    });

    if (repair.type === "SUSPENSION") {
      const savedItems = [];

      const lrGroups = {};

      normalizedItems.forEach((item) => {
        const st = item?.category?.name === "ช่วงล่าง";
        const itemSide = item.side;

        if (!st || itemSide === null) {
          savedItems.push({ ...item });
          return;
        }

        if (
          itemSide === "left" ||
          itemSide === "right" ||
          itemSide === "other"
        ) {
          savedItems.push({ ...item, side: itemSide });
          return;
        }

        if (isPerSide(item?.attributes)) {
          const key = `${item.id}-${item.sellingPrice}`;
          if (!lrGroups[key]) {
            lrGroups[key] = { base: item, count: 0 };
          }
          lrGroups[key].count += item.quantity || 1;
          return;
        }

        savedItems.push({ ...item });
      });

      let assignLeftoverToLeft = true;
      Object.values(lrGroups).forEach(({ base, count }) => {
        const pairs = Math.floor(count / 2);
        const remainder = count % 2;
        for (let i = 0; i < pairs; i++) {
          savedItems.push({ ...base, quantity: 1, side: "left" });
          savedItems.push({ ...base, quantity: 1, side: "right" });
        }
        if (remainder === 1) {
          savedItems.push({
            ...base,
            quantity: 1,
            side: assignLeftoverToLeft ? "left" : "right",
          });
          assignLeftoverToLeft = !assignLeftoverToLeft;
        }
      });

      navigate("/inspections/suspension", {
        state: {
          repairData: { ...repairData },
          repairItems: savedItems,
          scrollToItems: true,
          editRepairId: repair.id,
          from: location.state?.from,
          statusSlug: location.state?.statusSlug,
          vehicleId: location.state?.vehicleId,
          // ที่ที่เปิดบิลนี้ขึ้นมา (เช่นรายงานยอดขาย) ต้องติดไปตลอดทางแก้ไข
          // ไม่งั้นบันทึกเสร็จแล้วกดย้อนกลับจะเด้งกลับไปหน้าสรุปที่เพิ่งผ่านมา
          returnTo: location.state?.returnTo,
          currentDate: location.state?.currentDate,
          hideMoreFields: !repairData.name?.trim(),
        },
      });
      return;
    }

    navigate("/repairs/new", {
      state: {
        repairData: { ...repairData },
        repairItems: normalizedItems,
        scrollToItems: true,
        editRepairId: repair.id,
        from: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
        returnTo: location.state?.returnTo,
        currentDate: location.state?.currentDate,
        hideMoreFields: !repairData.name?.trim(),
      },
    });
  };

  const handleDeleteRepair = async () => {
    await withMinDuration(() => deleteRepair(repair.id));
    toast.success("ลบงานซ่อมเรียบร้อยแล้ว");
    setIsDeleteConfirmOpen(false);
    handleGoBack();
  };

  const handleGoBack = () => {
    if (
      location.state?.returnTo &&
      location.state.returnTo.includes("/admin/reports/sales")
    ) {
      navigate(location.state.returnTo, {
        state: { currentDate: location.state.currentDate },
      });
    } else {
      navigate(-1);
    }
  };

  const hasSingleCustomerLine =
    [
      !!repair?.customer?.name,
      !!(repair?.customer?.phoneNumber || repair?.customer?.address),
    ].filter(Boolean).length === 1;

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={handleGoBack}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          รายละเอียดการซ่อม
        </p>
        {/* วางแยกจากปุ่มหลักด้านล่าง เพื่อไม่ให้นิ้วพลาดไปโดนตอนกดเปลี่ยนสถานะ */}
        <button
          onClick={() => setIsDeleteConfirmOpen(true)}
          aria-label="ลบงานซ่อม"
          className="bg-destructive flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <Trash2 className="text-surface h-5 w-5" />
        </button>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] flex flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-[16px] pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div>
            <div className="mb-[16px] flex items-center justify-between px-[20px]">
              <p
                className={`text-[22px] leading-tight font-semibold md:text-2xl ${statusInfo.color}`}
              >
                รหัสการซ่อม: {repair.id}
              </p>
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
            <div className="my-[16px] flex items-center gap-[8px] px-[20px]">
              <div
                className={`flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
              >
                {isSaleRepair(repair) ? (
                  <ShoppingBag className="text-surface h-6 w-6" />
                ) : isNoVehicleRepair(repair) ? (
                  // Wrench ของ lucide ใช้สีตามตัวหนังสือ ต้องสั่งเป็นสีขาวเองบนวงกลมสีทึบ
                  <Wrench className="text-surface h-6 w-6" />
                ) : (
                  <BrandIcons
                    brand={repair.vehicle?.vehicleModel?.brand}
                    color={statusInfo.iconColor}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <p
                  className={`text-[22px] font-semibold md:text-2xl ${statusInfo.color} leading-tight`}
                >
                  {getRepairTitle(repair)}
                </p>
                {/* บิลที่ไม่ผูกกับรถมีกล่องข้อมูลลูกค้าแยกอยู่ข้างล่างแล้ว ไม่ต้องบอกชื่อซ้ำตรงนี้
                    ต่างจากการ์ดในลิสต์ที่มีบรรทัดเดียว จึงต้องยัดชื่อลูกค้าไว้ในนั้น */}
                {!isSaleRepair(repair) && !isNoVehicleRepair(repair) && (
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {getRepairSubtitle(repair)}
                  </p>
                )}
              </div>
            </div>
            {repair.customer && (
              <div>
                <div className="mb-[16px] flex items-start gap-[8px] px-[20px]">
                  <div
                    className={`mt-[6px] flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
                  >
                    <CircleUserRound color="#ffffff" />
                  </div>
                  {/* กรอกมาอย่างเดียว (ชื่อล้วน หรือเบอร์ล้วน) ข้อความจะสูงไม่ถึงวงกลม
                      ต้องดันให้อยู่กึ่งกลางแกนตั้งเทียบวงกลม ไม่งั้นจะลอยเกาะขอบบน */}
                  <div
                    className={
                      hasSingleCustomerLine
                        ? "mt-[6px] flex min-h-[45px] flex-col justify-center"
                        : "flex flex-col"
                    }
                  >
                    {repair.customer.name && (
                      <p
                        className={`text-[22px] font-semibold md:text-2xl ${statusInfo.color} leading-tight`}
                      >
                        {repair.customer.name}
                      </p>
                    )}
                    {(repair.customer.phoneNumber ||
                      repair.customer.address) && (
                      <div
                        className={`flex flex-wrap items-start gap-[8px] ${
                          repair.customer.name ? "mt-[4px]" : ""
                        }`}
                      >
                        {repair.customer.phoneNumber && (
                          <div className="flex flex-shrink-0 items-center gap-[4px]">
                            <Phone size={16} className="text-subtle-dark" />
                            <a
                              href={`tel:${repair.customer.phoneNumber}`}
                              className="text-subtle-dark text-lg leading-tight font-medium underline md:text-xl"
                            >
                              {formatPhone(repair.customer.phoneNumber)}
                            </a>
                          </div>
                        )}
                        {repair.customer.address && (
                          <div className="flex items-start gap-[4px]">
                            <MapPin
                              size={16}
                              className="text-subtle-dark mt-[2px] flex-shrink-0"
                            />
                            <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                              {repair.customer.address}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* เลขไมล์เป็นข้อมูลของรถ ณ วันซ่อม อ่านคู่กับทะเบียนและลูกค้าด้านบน
                ถ้าไปอยู่หลังยอดรวมจะกลายเป็นของแถมท้ายบิล เพราะยอดรวมเป็นจุดจบสายตาอยู่แล้ว */}
            {/* เลขไมล์เป็นข้อมูลของรถ ณ วันซ่อม อ่านคู่กับทะเบียนและลูกค้าด้านบน
                แถวเดียวจบ ไม่ต้องมีหัวข้อใหญ่ ไม่งั้นรายการซ่อมถูกดันลงไปไกลโดยไม่จำเป็น */}
            {repair.mileage != null && (
              <div className="mb-[16px] px-[20px]">
                <div className="flex items-center justify-between rounded-[10px] bg-gray-50 p-[16px]">
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
              <div className="mb-[16px] px-[20px]">
                <div className="mb-[8px] flex items-center justify-between">
                  <p className="text-normal text-[22px] font-semibold md:text-2xl">
                    รายการซ่อม
                  </p>
                  <button
                    onClick={handleEditRepair}
                    className="text-primary flex cursor-pointer items-center gap-[4px] text-xl font-semibold md:text-[22px]"
                  >
                    <Edit className="h-5 w-5" />
                    แก้ไขรายการซ่อม
                  </button>
                </div>
                {repair.type === "SUSPENSION" ? (
                  <div className="space-y-[16px]">
                    {(() => {
                      const suspensionItems = (repair.repairItems || []).filter(
                        (ri) =>
                          ri.part?.category?.name === "ช่วงล่าง" || ri.side,
                      );
                      const generalItems = (repair.repairItems || []).filter(
                        (ri) =>
                          ri.part?.category?.name !== "ช่วงล่าง" && !ri.side,
                      );

                      const leftItems = [];
                      const rightItems = [];
                      const otherItems = [];

                      const lrGroups = {};

                      suspensionItems.forEach((ri) => {
                        if (toUiSide(ri.side) === "left") {
                          leftItems.push(ri);
                          return;
                        }
                        if (toUiSide(ri.side) === "right") {
                          rightItems.push(ri);
                          return;
                        }
                        if (toUiSide(ri.side) === "other") {
                          otherItems.push(ri);
                          return;
                        }

                        const qty = ri.quantity || 1;
                        if (isPerSide(ri.part.attributes)) {
                          const key = `${ri.part.id}-${ri.unitPrice}`;
                          if (!lrGroups[key]) {
                            lrGroups[key] = { base: ri, count: 0 };
                          }
                          lrGroups[key].count += qty;
                          return;
                        }
                        // ไม่แยกข้าง และไม่ได้ระบุตำแหน่งมา -> เข้าช่องอื่นๆ
                        otherItems.push(ri);
                      });

                      let assignLeftoverToLeft = true;
                      Object.values(lrGroups).forEach(({ base, count }) => {
                        const pairs = Math.floor(count / 2);
                        const remainder = count % 2;
                        for (let i = 0; i < pairs; i++) {
                          leftItems.push({ ...base, quantity: 1 });
                          rightItems.push({ ...base, quantity: 1 });
                        }
                        if (remainder === 1) {
                          if (assignLeftoverToLeft) {
                            leftItems.push({ ...base, quantity: 1 });
                          } else {
                            rightItems.push({ ...base, quantity: 1 });
                          }
                          assignLeftoverToLeft = !assignLeftoverToLeft;
                        }
                      });

                      // ของที่เปลี่ยนทั้งสองข้างยุบเป็นบรรทัดเดียว ให้ตรงกับหน้าสรุปก่อนบันทึก
                      const { bothSides, leftOnly, rightOnly } =
                        groupBySidePairs(leftItems, rightItems);

                      return (
                        <div>
                          {bothSides.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <ArrowLeftRight className="mt-[2px]" />
                                รายการซ่อมฝั่งซ้าย-ขวา
                              </p>
                              <div className="space-y-[12px]">
                                {bothSides.map((item, idx) => (
                                  <RepairItemCard
                                    key={`both-${idx}`}
                                    item={item}
                                    variant="detail"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {leftOnly.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <ArrowLeft className="mt-[2px]" />
                                รายการซ่อมฝั่งซ้าย
                              </p>
                              <div className="space-y-[12px]">
                                {leftOnly.map((item, idx) => (
                                  <RepairItemCard
                                    key={`left-${idx}`}
                                    item={item}
                                    variant="detail"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {rightOnly.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <ArrowRight className="mt-[2px]" />
                                รายการซ่อมฝั่งขวา
                              </p>
                              <div className="space-y-[12px]">
                                {rightOnly.map((item, idx) => (
                                  <RepairItemCard
                                    key={`right-${idx}`}
                                    item={item}
                                    variant="detail"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {otherItems.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <Ellipsis className="mt-[2px]" />
                                รายการซ่อมอื่นๆ
                              </p>
                              <div className="space-y-[12px]">
                                {otherItems.map((item, idx) => (
                                  <RepairItemCard
                                    key={`other-${idx}`}
                                    item={item}
                                    variant="detail"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {generalItems.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <Wrench className="mt-[2px]" />
                                รายการซ่อมเพิ่มเติม
                              </p>
                              <div className="space-y-[12px]">
                                {generalItems.map((item, idx) => (
                                  <RepairItemCard
                                    key={`general-${idx}`}
                                    item={item}
                                    variant="detail"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-[16px]">
                    {repair.repairItems.map((item, index) => (
                      <RepairItemCard
                        key={index}
                        item={item}
                        variant="detail"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ยอดรวมเปลี่ยนสีตามสถานะ — จำนวนเงินที่ยังไม่ได้เก็บกับที่เก็บแล้วคนละความหมายกัน */}
            <div
              className={`${statusInfo.softBorder} ${statusInfo.softBg} mx-[20px] mb-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                    รวม {repair.repairItems?.length || 0} รายการ
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
              <div className="mb-[16px] px-[20px]">
                <p className="text-normal mb-[16px] text-[22px] font-semibold md:text-2xl">
                  รายละเอียดการซ่อม
                </p>
                <div className="rounded-[10px] bg-gray-50 p-[16px]">
                  <p className="text-normal text-lg leading-relaxed font-medium md:text-xl">
                    {repair.description}
                  </p>
                </div>
              </div>
            )}
            <div ref={paymentSectionRef} className="mb-[16px] px-[20px]">
              <p className="text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                การชำระเงิน
              </p>
              <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                <div className="flex items-center justify-between gap-[8px]">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    วิธีชำระเงิน:
                  </p>
                  {repair.status !== "PAID" ? (
                    // ใช้ตัวเดียวกับดรอปดาวน์อื่นทั้งระบบ หน้าตาจะได้ไม่หลุดไปคนละแบบ
                    // คุมความกว้างจากข้างนอกเพราะแถวนี้เป็นป้ายซ้าย-ค่าขวา ไม่ใช่ช่องเต็มบรรทัดแบบในฟอร์ม
                    <div className="w-[210px] shrink-0">
                      <ComboBox
                        options={
                          repair.status === "CREDIT"
                            ? PAYMENT_METHODS
                            : PAYMENT_OPTIONS_WITH_CREDIT
                        }
                        value={selectedPaymentMethod}
                        onChange={(value) => {
                          setSelectedPaymentMethod(value);
                          setPaymentMethodError("");
                        }}
                        placeholder="-- เลือกวิธีชำระเงิน --"
                        customClass="text-lg md:text-xl"
                        name="paymentMethod"
                        errors={
                          paymentMethodError
                            ? { paymentMethod: { message: paymentMethodError } }
                            : undefined
                        }
                        hideErrorMessage
                      />
                    </div>
                  ) : (
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {getPaymentMethodText(repair.paymentMethod)}
                    </p>
                  )}
                </div>
                {/* กินความกว้างเต็มกล่องเพื่อให้อยู่บรรทัดเดียว แล้วดันไปชิดขวา
                    จะได้อยู่ใต้ช่องที่ต้องแก้ ไม่ใช่ใต้ป้ายที่ไม่มีอะไรให้ทำ */}
                <FieldErrorList
                  messages={[paymentMethodError]}
                  className="items-end"
                />
                <div className="flex justify-between">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    สถานะการซ่อม:
                  </p>
                  {/* อ่านจากสถานะจริงของบิล ไม่ใช่เดาจากเวลาที่ชำระเงิน
                      ไม่งั้นบิลที่ยังกำลังซ่อมจะขึ้นว่าซ่อมเสร็จสิ้น */}
                  <p
                    className={`text-lg font-semibold md:text-xl ${statusInfo.color}`}
                  >
                    {statusInfo.text}
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-[16px] px-[20px]">
              <p className="text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                {paidOnCreate ? "เวลาชำระเงิน" : "เวลาดำเนินการ"}
              </p>
              <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                {/* บิลขายหน้าร้านเกิดและจบพร้อมกัน ไม่มีช่วงซ่อม แสดงเวลาชำระเงินอย่างเดียว */}
                {!paidOnCreate && (
                  <>
                    <div className="flex justify-between">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        เริ่มซ่อม:
                      </p>
                      <p className="text-normal text-lg font-medium md:text-xl">
                        {formatDate(repair.createdAt)} |{" "}
                        {formatTime(repair.createdAt)} น.
                      </p>
                    </div>
                    {repair.completedAt && (
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-lg font-medium md:text-xl">
                          ซ่อมเสร็จสิ้น:
                        </p>
                        <p className="text-normal text-lg font-medium md:text-xl">
                          {formatDate(repair.completedAt)} |{" "}
                          {formatTime(repair.completedAt)} น.
                        </p>
                      </div>
                    )}
                  </>
                )}
                {repair.paidAt && (
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      {paidOnCreate ? "วันเวลา:" : "ชำระเงิน:"}
                    </p>
                    <p className="text-normal text-lg font-medium md:text-xl">
                      {formatDate(repair.paidAt)} | {formatTime(repair.paidAt)}{" "}
                      น.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {repair.user && (
              <div className="px-[20px]">
                <p className="text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                  ผู้รับงานซ่อม
                </p>
                <div className="rounded-[10px] bg-gray-50 p-[16px]">
                  <p className="text-normal text-lg font-medium md:text-xl">
                    {repair.user.name}
                  </p>
                </div>
              </div>
            )}
            {getNextStatus(repair.status) && (
              <div className="mt-[16px] flex flex-col gap-[16px] pr-[40px]">
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

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteRepair}
        title="ยืนยันการลบงานซ่อม"
        itemName={getRepairTitle(repair)}
        itemDetail={getRepairSubtitle(repair)}
      />
    </div>
  );
};

export default RepairDetail;
