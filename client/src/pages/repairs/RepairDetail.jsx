import PageSpinner from "@/components/ui/PageSpinner";
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
  ClipboardList,
  Printer,
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
  ChevronRight,
} from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import { onKeyActivate } from "@/utils/a11y";
import OrganizationTypeDialog from "@/components/dialogs/OrganizationTypeDialog";
import { organizationLabel, creditPathFor } from "@/constants/organizations";
import { Building2, Store, SquarePen, IdCard } from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import ReceiptPreviewDialog from "@/components/dialogs/ReceiptPreviewDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import ComboBox from "@/components/ui/ComboBox";
import PartPreviewDialog from "@/components/dialogs/PartPreviewDialog";
import {
  isPartPlaceholderItem,
  isSingleQuantityItem,
  hasTypedUnit,
} from "@/constants/services";
import FieldErrorList from "@/components/forms/FieldErrorList";
import { toast } from "sonner";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { toastError } from "@/utils/handleError";
import { groupBySidePairs } from "@/utils/repairItemGroups";
import { isPerSide } from "@/utils/suspension";
import {
  getPaymentMethodText,
  PAYMENT_METHODS,
  PAYMENT_OPTIONS_WITH_CREDIT,
  CREDIT_OPTION_ID,
} from "@/constants/paymentMethods";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { usePrefetchPages } from "@/routes/pageImports";

const RepairDetail = () => {
  // เตรียมโค้ดของหน้าที่มักไปต่อจากหน้านี้ กดแล้วจะได้ไม่ต้องรอโหลด
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
  // ช่องที่ยังไม่ได้เลือกขึ้นกรอบแดงใต้ช่องเหมือนฟอร์มอื่นในระบบ ไม่ใช่เด้งข้อความแล้วหายไป
  const [paymentMethodError, setPaymentMethodError] = useState("");
  // บิลที่จ่ายแล้วโชว์เป็นข้อความ กดดินสอถึงจะกลายเป็นช่องเลือก
  const [isEditingPaidMethod, setIsEditingPaidMethod] = useState(false);
  const [isSavingEstimate, setIsSavingEstimate] = useState(false);
  const [isEstimateConfirmOpen, setIsEstimateConfirmOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  // กดการ์ดในบิลเพื่อดูรูปกับรายละเอียดของสิ่งที่ขายไป
  const [previewItem, setPreviewItem] = useState(null);
  const isCreditSelected = selectedPaymentMethod === CREDIT_OPTION_ID;
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
      case "ESTIMATE":
        return {
          text: "ใบประเมินราคา",
          color: "text-status-estimate",
          bg: "bg-status-estimate",
          softBorder: "border-status-estimate/30",
          softBg: "from-status-estimate/10 to-status-estimate/5",
          iconColor: "#06b6d4",
          icon: ClipboardList,
        };
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
      case "ESTIMATE":
        return "IN_PROGRESS";
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

  const getNextStatusButtonClass = (currentStatus) => {
    switch (currentStatus) {
      case "ESTIMATE":
        return "bg-status-progress";
      case "IN_PROGRESS":
        return "bg-status-completed";
      case "COMPLETED":
      case "CREDIT":
        return "bg-status-paid";
    }
  };

  // บิลที่จ่ายแล้ว: เปลี่ยนวิธีชำระเงินแล้วบันทึกเลย ไม่ต้องมีปุ่มยืนยันซ้ำ
  // ส่งสถานะเดิมไปด้วยเพราะเซิร์ฟเวอร์รับคำสั่งเป็น "อัปเดตสถานะ" ตัวเดียว
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
      // กลับไปใช้ค่าเดิมในช่อง ไม่งั้นหน้าจอจะบอกคนละอย่างกับที่บันทึกไว้จริง
      setSelectedPaymentMethod(repair.paymentMethod || "");
      setIsEditingPaidMethod(false);
      toastError(error);
    }
  };

  // เก็บบิลที่ยังไม่ได้ซ่อมไว้เป็นใบประเมินราคา ของในบิลถูกคืนเข้าคลังโดยเซิร์ฟเวอร์
  const handleSaveAsEstimate = async () => {
    if (!repair || isSavingEstimate) return;

    try {
      setIsSavingEstimate(true);
      await withMinDuration(() =>
        updateRepairStatus(repair.id, { status: "ESTIMATE" }),
      );
      setIsEstimateConfirmOpen(false);
      toast.success("บันทึกเป็นใบประเมินราคาเรียบร้อยแล้ว");
      // แทนที่หน้าบิลในประวัติ ไม่ซ้อนเพิ่ม เพราะบิลใบนั้นไม่ได้อยู่ในกองกำลังซ่อมแล้ว
      // กดย้อนกลับจากหน้าใบประเมินราคาจึงไปถึงรายการที่มาตั้งแต่แรกในครั้งเดียว
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

    // ลูกค้ายังไม่เคยตั้งประเภท ถามก่อนแล้วค่อยลงเครดิต ตอบแล้วจะวนกลับมาทำต่อเอง
    // ถามก่อนเพราะถ้าปิดกล่องทิ้ง บิลจะได้ไม่ถูกลงเครดิตไปแล้วทั้งที่ยังไม่ได้ตอบ
    if (
      nextStatus === "CREDIT" &&
      repair.customer &&
      !repair.customer.organizationType &&
      !creditTypeAnsweredRef.current
    ) {
      pendingCreditSkipRef.current = skipToCompleted;
      setIsOrgDialogOpen(true);
      return;
    }

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
      } else if (nextStatus === "IN_PROGRESS") {
        toast.success("เริ่มซ่อมแล้ว");
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

      // บิลย้ายกองไปแล้ว หน้าบิลเดิมในประวัติจึงหมดหน้าที่ ใช้แทนที่แทนการซ้อนเพิ่ม
      // กดย้อนกลับครั้งเดียวจะถึงรายการที่มาตั้งแต่แรก ไม่ต้องผ่านบิลที่ย้ายออกไปแล้ว

      // ลงเครดิตแล้วพาไปที่กองที่บิลไปอยู่จริง ไม่งั้นจะหาบิลที่เพิ่งลงไม่เจอ
      // เครดิตทุกแบบอยู่หน้าเดียวกันแล้ว ต่างแค่กองย่อย
      if (nextStatus === "CREDIT") {
        // ประเภทที่เพิ่งเลือกในกล่องยังไม่อยู่ในข้อมูลบิลที่ถืออยู่ ใช้ค่าที่จำไว้ก่อน
        navigate(
          creditPathFor(
            creditTypeAnsweredRef.current
              ? pendingCreditTypeRef.current
              : repair.customer?.organizationType,
          ),
          { replace: true },
        );
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
      taxId: repair?.customer?.taxId || "",
      brand: repair?.vehicle?.vehicleModel?.brand || "",
      model: repair?.vehicle?.vehicleModel?.model || "",
      plateLetters,
      plateNumbers,
      // ฟอร์มงานซ่อมเก็บจังหวัดเป็นชื่อ ไม่ใช่ id — ส่ง id ไปดรอปดาวน์จะหาค่าไม่เจอแล้วช่องว่าง
      province: provinceName,
      description: repair?.description || "",
      mileage: repair?.mileage != null ? String(repair.mileage) : "",
      type: repair?.type || "GENERAL",
      // บิลขายหน้าร้านเก็บเงินไปแล้ว ต้องยกวิธีชำระเงินเดิมไปด้วย
      // ไม่งั้นหน้าสรุปจะขึ้นว่ายังไม่ได้เลือก แล้วคนแก้บิลต้องเดาว่าวันนั้นรับเงินมาทางไหน
      //
      // บิลที่ติดเครดิตไม่มีวิธีจ่ายเก็บไว้ (เพราะยังไม่ได้เงิน) ต้องบอกด้วยตัวสถานะแทน
      paymentMethod:
        repair?.status === "CREDIT"
          ? CREDIT_OPTION_ID
          : repair?.paymentMethod || "",
      // บิลที่ไม่ได้ผูกกับรถ (งานบริการ) ต้องกลับเข้าโหมดเดิม ไม่งั้นจะถูกบังคับให้เลือกรถ
      noVehicle: !repair?.vehicle,
    };

    const normalizedItems = (repair?.repairItems || []).map((ri) => {
      if (ri.part) {
        // ชื่อที่ระบบประกอบเองจะมีชื่อในคลังอยู่ข้างในเสมอ ถ้าไม่มีแปลว่าถูกพิมพ์ทับไว้
        // บรรทัดที่พิมพ์ทับต้องยกชื่อจากบิลกลับเข้าฟอร์ม ไม่งั้นเปิดแก้ไขแล้วชื่อจะหาย
        // (บรรทัดปกติใช้ชื่อในคลัง เพราะการ์ดในฟอร์มเติมยี่ห้อกับขนาดยางให้เองอยู่แล้ว)
        const hasCustomName =
          !!ri.part.name && !String(ri.itemName || "").includes(ri.part.name);

        return {
          id: ri.part.id,
          partNumber: ri.part.partNumber,
          // ยี่ห้อต้องคงไว้เสมอ เพราะการนับสต็อกคืนใช้ตรวจว่าบรรทัดนี้เป็นอะไหล่จริง
          // การกันเติมยี่ห้อซ้ำหน้าชื่อที่พิมพ์เองไปทำตอนแสดงผลแทน (ดู hasCustomName)
          brand: ri.part.brand || "",
          name: hasCustomName ? ri.itemName : ri.part.name || "",
          hasCustomName,
          sellingPrice: Number(ri.unitPrice),
          // สต็อกดิบของอะไหล่ ยังไม่บวกของที่บิลนี้เบิกไป
          // หน้ากรอกงานจะบวกคืนให้เองตอนคิดเพดานของปุ่มบวก (ดู restoredStockMap)
          // ชื่อฟิลด์ต้องเป็น stockQuantity ให้ตรงกับที่หน้าโน้นอ่าน ไม่งั้นเพดานจะกลายเป็นศูนย์
          stockQuantity: ri.part.stockQuantity ?? 0,
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
        isSingleLine: isSingleQuantityItem(ri),
        isTypedUnitLine: hasTypedUnit(ri),
        unit: ri.itemUnit || "",
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
          // ตำแหน่งของหน้าก่อนหน้าบิลนี้ในประวัติ (หน้าที่ผู้ใช้มาตั้งแต่แรก)
          // บันทึกเสร็จแล้วจะถอยกลับไปที่นั่นทีเดียว ประวัติจะได้ไม่เหลือหน้าแก้ไขกับหน้าสรุปค้างอยู่
          backIdx:
            typeof window.history.state?.idx === "number"
              ? window.history.state.idx - 1
              : null,
          // ใบประเมินราคายังไม่เคยเบิกของ ห้ามบวกของในบิลคืนตอนคิดว่าเบิกได้เท่าไหร่
          stockNotDeducted: repair.status === "ESTIMATE",
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
        // ตำแหน่งของหน้าก่อนหน้าบิลนี้ในประวัติ (หน้าที่ผู้ใช้มาตั้งแต่แรก)
        // บันทึกเสร็จแล้วจะถอยกลับไปที่นั่นทีเดียว ประวัติจะได้ไม่เหลือหน้าแก้ไขกับหน้าสรุปค้างอยู่
        backIdx:
          typeof window.history.state?.idx === "number"
            ? window.history.state.idx - 1
            : null,
        from: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
        returnTo: location.state?.returnTo,
        currentDate: location.state?.currentDate,
        hideMoreFields: !repairData.name?.trim(),
      },
    });
  };

  // ใบประเมินราคายังไม่ใช่งานซ่อม และบิลขายหน้าร้านก็ไม่มีงานซ่อม
  // เรียกให้ตรงกับของที่กำลังจะถูกลบ ไม่งั้นคนกดจะนึกว่าลบผิดใบ
  const deleteTargetName =
    repair?.status === "ESTIMATE"
      ? "ใบประเมินราคา"
      : isSaleRepair(repair)
        ? "รายการขาย"
        : "งานซ่อม";

  // บิลที่ไม่มีชื่อลูกค้าจะได้คำว่า "ลูกค้าทั่วไป" มาเป็นบรรทัดขยาย
  // ซึ่งไม่ได้ช่วยระบุว่าเป็นใบไหน ในกล่องยืนยันจึงไม่ต้องมีบรรทัดนั้น
  const confirmItemDetail =
    getRepairSubtitle(repair) === "ลูกค้าทั่วไป"
      ? ""
      : getRepairSubtitle(repair);

  const handleDeleteRepair = async () => {
    await withMinDuration(() => deleteRepair(repair.id));
    toast.success(`ลบ${deleteTargetName}เรียบร้อยแล้ว`);
    setIsDeleteConfirmOpen(false);
    handleGoBack();
  };

  // แปลงรายการในบิลให้อยู่ในรูปที่หน้าต่างรายละเอียดใช้ได้
  // ชื่อใช้ของที่บันทึกไว้ในบิล เพราะรวมยี่ห้อกับขนาดยางไว้แล้ว และบริการอาจถูกพิมพ์ชื่อเอง
  // ราคาใช้ราคาที่ขายจริงในบิล ไม่ใช่ราคาปัจจุบันในคลัง
  const toPreviewItem = (item) => ({
    name: item.itemName,
    // ชื่อบนบรรทัดถูกพิมพ์ทับไปแล้ว ดูจากบริการต้นทางว่าเป็นบรรทัดอะไหล่ไหม
    // ไม่งั้นหน้าต่างจะขึ้นว่า "รายละเอียดบริการ" ทั้งที่เป็นอะไหล่ที่ซื้อมาต่างหาก
    isPartLine: isPartPlaceholderItem(item),
    category: item.part?.category || item.service?.category || null,
    partNumber: item.part?.partNumber || null,
    description: item.part?.description || item.service?.description || null,
    secureUrl: item.part?.secureUrl || null,
    sellingPrice: Number(item.unitPrice),
  });

  // กดแถวทะเบียนแล้วไปดูประวัติของรถคันนั้น บอกด้วยว่ามาจากบิลไหน
  // ปุ่มย้อนกลับของหน้าประวัติรถจะได้พากลับมาที่บิลนี้ ไม่ใช่โยนไปหน้ารายการ
  //
  // เปิดบิลนี้มาจากหน้าประวัติรถคันเดียวกัน = ไม่มีที่ให้ไปต่อ ปิดการกดและซ่อนลูกศร
  // ไม่งั้นกดไปกลับหลายรอบ ประวัติจะซ้อนยาวจนต้องกดย้อนกลับเป็นสิบครั้งกว่าจะพ้น
  const cameFromThisVehicle =
    location.state?.from === "vehicle-detail" &&
    String(location.state?.vehicleId) === String(repair?.vehicle?.id);
  const canOpenVehicle = !!repair?.vehicle?.id && !cameFromThisVehicle;

  const handleOpenVehicle = () => {
    if (!canOpenVehicle) return;
    navigate(`/vehicles/${repair.vehicle.id}`);
  };

  // บิลเครดิตมักเป็นของหน่วยงานราชการหรือร้านค้าที่มาเคลียร์ทีเดียวตอนสิ้นเดือน
  // ตั้งประเภทไว้ที่ตัวลูกค้า บิลใบต่อไปของรายเดียวกันจึงถูกรวมให้เอง
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  // จำว่ากล่องถูกเปิดระหว่างกำลังลงเครดิตหรือเปล่า (null = ไม่ได้อยู่ในขั้นตอนนั้น)
  // และตอบว่าอะไร เพื่อให้ลงเครดิตทำต่อได้ทันทีหลังบันทึกประเภท
  const pendingCreditSkipRef = useRef(null);
  const creditTypeAnsweredRef = useRef(false);
  const pendingCreditTypeRef = useRef(null);
  // ประเภทที่เพิ่งเปลี่ยนระหว่างเปิดบิลนี้ ใช้เลือกปลายทางของปุ่มย้อนกลับ
  const changedTypeRef = useRef(undefined);
  // ปุ่มขึ้นเฉพาะบิลเครดิต แต่ตัวกล่องต้องเรียกได้ตลอด เพราะหลังกดลงเครดิต
  // ข้อมูลบิลในมือยังเป็นสถานะเดิมอยู่ (ไม่ได้โหลดใหม่ เพราะกำลังจะออกจากหน้า)
  const hasCustomer = !!repair?.customer;
  const canSetOrganization = repair?.status === "CREDIT" && hasCustomer;

  const handleGoBack = () => {
    // เปลี่ยนประเภทระหว่างเปิดบิลนี้ = กองที่มาตอนแรกไม่มีบิลใบนี้แล้ว
    // พาไปกองใหม่แทน ไม่งั้นกลับไปเจอรายการที่หายไปหนึ่งใบโดยไม่รู้ว่าไปไหน
    //
    // ดูจากสถานะของบิล ไม่ใช่ป้ายที่ติดมากับหน้า เพราะบิลที่กดมาจากในหน้าของหน่วยงาน
    // ไม่มีป้ายนั้นติดมาด้วย แต่ก็อยู่ในหน้าเครดิตเหมือนกัน
    // (เข้ามาจากหน้าประวัติรถหรือรายงานยอดขาย จัดการด้วยเงื่อนไขข้างล่างตามเดิม)
    const cameFromCreditPage =
      location.state?.from !== "vehicle-detail" && !location.state?.returnTo;

    if (
      changedTypeRef.current !== undefined &&
      repair?.status === "CREDIT" &&
      cameFromCreditPage
    ) {
      navigate(creditPathFor(changedTypeRef.current), { replace: true });
      return;
    }

    if (
      location.state?.returnTo &&
      location.state.returnTo.includes("/admin/reports/sales")
    ) {
      navigate(location.state.returnTo, {
        // กลับด้วยการสั่งไปหน้าเดิม ไม่ใช่ถอยประวัติ ต้องบอกเองว่านี่คือการย้อนกลับ
        state: { currentDate: location.state.currentDate, restoreScroll: true },
      });
    } else {
      navigate(-1);
    }
  };

  const hasSingleCustomerLine =
    [
      !!repair?.customer?.name,
      !!(
        repair?.customer?.phoneNumber ||
        repair?.customer?.address ||
        repair?.customer?.taxId
      ),
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
        {/* บิลที่กำลังซ่อมมีปุ่มไอคอนสามอัน (พิมพ์ ใบประเมินราคา ลบ) ที่เหลือให้ชื่อหน้าจึงแคบ
            เฉพาะกรณีนั้นบนจอเล็กจึงลดขนาดลงหนึ่งขั้นให้อ่านได้ครบคำ สถานะอื่นมีสองปุ่ม ขนาดเท่าเดิม */}
        <p
          className={`text-surface min-w-0 flex-1 truncate font-semibold sm:text-2xl md:text-[26px] ${
            repair?.status === "IN_PROGRESS" ? "text-xl" : "text-2xl"
          }`}
        >
          รายละเอียดการซ่อม
        </p>
        {/* ปุ่มทั้งแถวรอข้อมูลมาก่อนแล้วค่อยขึ้นพร้อมกัน
            ไม่งั้นปุ่มใบประเมินราคาจะแทรกเข้ามาทีหลังแล้วดันปุ่มอื่นเลื่อนที่
            ซึ่งอันตรายเพราะปุ่มลบอยู่ในแถวเดียวกัน */}
        {!isLoading && (
          <>
            {/* พิมพ์ได้ทุกสถานะ บางครั้งลูกค้าขอใบไปก่อนตั้งแต่ยังไม่จ่าย */}
            <button
              onClick={() => setIsReceiptOpen(true)}
              aria-label="พิมพ์ใบเสร็จ"
              className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
            >
              <Printer className="text-surface h-5 w-5" />
            </button>

            {/* ประเมินราคาไว้ก่อน ลูกค้ายังไม่ตกลงซ่อม — ของที่จองไว้ในบิลจะถูกคืนเข้าคลัง
            มีเฉพาะบิลที่ยังซ่อมอยู่ บิลที่เก็บเงินไปแล้วย้อนกลับไปเป็นใบประเมินไม่ได้ */}
            {repair?.status === "IN_PROGRESS" && (
              <button
                onClick={() => setIsEstimateConfirmOpen(true)}
                disabled={isSavingEstimate}
                aria-label="บันทึกเป็นใบประเมินราคา"
                className="bg-status-estimate flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full disabled:opacity-60"
              >
                {isSavingEstimate ? (
                  <LoaderCircle className="text-surface h-5 w-5 animate-spin" />
                ) : (
                  <ClipboardList className="text-surface h-5 w-5" />
                )}
              </button>
            )}
            {/* วางแยกจากปุ่มหลักด้านล่าง เพื่อไม่ให้นิ้วพลาดไปโดนตอนกดเปลี่ยนสถานะ */}
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              aria-label={`ลบ${deleteTargetName}`}
              className="bg-destructive flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
            >
              <Trash2 className="text-surface h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <div className="bg-surface shadow-primary mt-[16px] flex flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-[16px] pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <PageSpinner />
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
            {/* บิลที่ผูกกับรถ กดแถวนี้เพื่อไปดูประวัติของรถคันนั้นได้
                (บิลขายหน้าร้านกับงานที่ไม่มีรถ ไม่มีปลายทางให้ไป จึงกดไม่ได้) */}
            <div
              {...(canOpenVehicle
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: handleOpenVehicle,
                    onKeyDown: onKeyActivate(handleOpenVehicle),
                    "aria-label": "ดูประวัติรถคันนี้",
                    className:
                      "my-[16px] flex cursor-pointer items-center gap-[8px] px-[20px]",
                  }
                : {
                    className:
                      "my-[16px] flex items-center gap-[8px] px-[20px]",
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
                {/* บิลที่ไม่ผูกกับรถมีกล่องข้อมูลลูกค้าแยกอยู่ข้างล่างแล้ว ไม่ต้องบอกชื่อซ้ำตรงนี้
                    ต่างจากการ์ดในลิสต์ที่มีบรรทัดเดียว จึงต้องยัดชื่อลูกค้าไว้ในนั้น */}
                {!isSaleRepair(repair) && !isNoVehicleRepair(repair) && (
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {getRepairSubtitle(repair)}
                  </p>
                )}
              </div>
              {canOpenVehicle && (
                // วงกลมพื้นอ่อนทำให้ลูกศรเด่นพอจะอ่านว่าแถวนี้กดได้
                // ใช้สีเทากลางๆ ไม่ผูกกับสถานะ ไม่งั้นจะไปแย่งความเด่นของไอคอนรถทางซ้าย
                <span className="bg-subtle-light/15 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full">
                  <ChevronRight className="text-subtle-dark h-5 w-5" />
                </span>
              )}
            </div>
            {repair.customer && (
              <div>
                <div className="mb-[16px] flex items-start gap-[8px] px-[20px]">
                  <div
                    className={`mt-[6px] flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
                  >
                    {/* ไอคอนบอกประเภทลูกค้าไปเลย กวาดตาแล้วรู้ว่าบิลนี้เป็นของใครแบบไหน
                        ทั้งสามแบบใช้กรอบเดียวกับไอคอนอื่น จะได้ไม่มีวงไหนดูต่างออกไป */}
                    <OutlineCardIcon
                      icon={
                        repair.customer.organizationType === "GOVERNMENT"
                          ? Building2
                          : repair.customer.organizationType === "SHOP"
                            ? Store
                            : CircleUserRound
                      }
                      color={statusInfo.iconColor}
                    />
                  </div>
                  {/* กรอกมาอย่างเดียว (ชื่อล้วน หรือเบอร์ล้วน) ข้อความจะสูงไม่ถึงวงกลม
                      ต้องดันให้อยู่กึ่งกลางแกนตั้งเทียบวงกลม ไม่งั้นจะลอยเกาะขอบบน */}
                  <div
                    className={
                      hasSingleCustomerLine
                        ? "mt-[6px] flex min-h-[45px] min-w-0 flex-1 flex-col justify-center"
                        : "flex min-w-0 flex-1 flex-col"
                    }
                  >
                    {repair.customer.name && (
                      <p
                        className={`text-[22px] font-semibold md:text-2xl ${statusInfo.color} leading-tight`}
                      >
                        {repair.customer.name}
                      </p>
                    )}
                    {/* ขึ้นเฉพาะหน่วยงานกับร้านค้า ซึ่งเป็นข้อยกเว้นที่ต้องรู้
                        ลูกค้าทั่วไปมีเกือบทุกบิล บอกไปก็ไม่ได้อะไรใหม่ ไม่มีบรรทัดนี้ก็แปลว่าทั่วไป
                        ใช้สีเดียวกับบรรทัดยี่ห้อ-รุ่นรถ เพราะทำหน้าที่เดียวกันคือขยายบรรทัดบน */}
                    {repair.customer.organizationType && (
                      <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                        {organizationLabel(repair.customer.organizationType)}
                      </p>
                    )}
                    {(repair.customer.phoneNumber ||
                      repair.customer.address ||
                      repair.customer.taxId) && (
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
                        {repair.customer.taxId && (
                          <div className="flex flex-shrink-0 items-center gap-[4px]">
                            <IdCard size={16} className="text-subtle-dark" />
                            <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                              {repair.customer.taxId}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* ตั้งประเภทลูกค้าได้จากบิลเครดิต เพราะเป็นจังหวะที่รู้ว่าใครติดเงินไว้ */}
                  {canSetOrganization && (
                    <button
                      type="button"
                      onClick={() => setIsOrgDialogOpen(true)}
                      aria-label="ตั้งประเภทลูกค้า"
                      title="ตั้งประเภทลูกค้า"
                      className="bg-subtle-light/15 mt-[6px] flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
                    >
                      <SquarePen className="text-subtle-dark h-5 w-5" />
                    </button>
                  )}
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
                                รายการซ่อมข้างซ้าย-ขวา
                              </p>
                              <div className="space-y-[12px]">
                                {bothSides.map((item, idx) => (
                                  <RepairItemCard
                                    key={`both-${idx}`}
                                    item={item}
                                    variant="detail"
                                    onClick={() => setPreviewItem(item)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {leftOnly.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <ArrowLeft className="mt-[2px]" />
                                รายการซ่อมข้างซ้าย
                              </p>
                              <div className="space-y-[12px]">
                                {leftOnly.map((item, idx) => (
                                  <RepairItemCard
                                    key={`left-${idx}`}
                                    item={item}
                                    variant="detail"
                                    onClick={() => setPreviewItem(item)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {rightOnly.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                                <ArrowRight className="mt-[2px]" />
                                รายการซ่อมข้างขวา
                              </p>
                              <div className="space-y-[12px]">
                                {rightOnly.map((item, idx) => (
                                  <RepairItemCard
                                    key={`right-${idx}`}
                                    item={item}
                                    variant="detail"
                                    onClick={() => setPreviewItem(item)}
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
                                    onClick={() => setPreviewItem(item)}
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
                                    onClick={() => setPreviewItem(item)}
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
                        onClick={() => setPreviewItem(item)}
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
                {/* บิลขายหน้าร้านไม่มีงานซ่อม ช่องนี้คือหมายเหตุของการขาย
                    ใช้คำเดียวกับป้ายในหน้ากรอกบิลและหน้าสรุป */}
                <p className="text-normal mb-[16px] text-[22px] font-semibold md:text-2xl">
                  {isSaleRepair(repair) ? "หมายเหตุ" : "รายละเอียดการซ่อม"}
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
                {repair.status === "ESTIMATE" ? "สถานะ" : "การชำระเงิน"}
              </p>
              <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                {/* ใบประเมินราคายังไม่มีการเก็บเงิน เลือกวิธีชำระเงินตอนนี้ก็ไม่มีผลอะไร
                    เหลือไว้แค่บรรทัดสถานะ ไม่ต้องมีช่องให้กดเล่น */}
                {repair.status !== "ESTIMATE" && (
                  <>
                    <div className="flex items-center justify-between gap-[8px]">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        วิธีชำระเงิน:
                      </p>
                      {/* บิลที่จ่ายแล้วเป็นเอกสารที่จบแล้ว ทั้งกล่องจึงเป็นข้อความอ่านอย่างเดียว
                        แต่กดผิดวิธีตอนเก็บเงินเป็นเรื่องที่เกิดได้ จึงมีดินสอให้กดแก้ทีหลัง
                        กดแล้วบรรทัดนั้นค่อยกลายเป็นช่องเลือก เลือกเสร็จบันทึกทันทีแล้วกลับเป็นข้อความ
                        (รูปแบบเดียวกับการกดแก้ราคาที่แถวรายการซ่อม) */}
                      {repair.status === "PAID" && !isEditingPaidMethod ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingPaidMethod(true)}
                          aria-label="แก้ไขวิธีชำระเงิน"
                          className="text-normal flex shrink-0 cursor-pointer items-center gap-[6px] text-lg font-semibold md:text-xl"
                        >
                          {getPaymentMethodText(repair.paymentMethod) ||
                            "ไม่ระบุ"}
                          <Edit className="text-primary h-4 w-4" />
                        </button>
                      ) : (
                        <div className="w-[210px] shrink-0">
                          <ComboBox
                            options={
                              repair.status === "PAID" ||
                              repair.status === "CREDIT"
                                ? PAYMENT_METHODS
                                : PAYMENT_OPTIONS_WITH_CREDIT
                            }
                            value={selectedPaymentMethod}
                            onChange={(value) => {
                              setSelectedPaymentMethod(value);
                              setPaymentMethodError("");
                              if (repair.status === "PAID") {
                                handleChangePaidMethod(value);
                              }
                            }}
                            placeholder="-- เลือกวิธีชำระเงิน --"
                            customClass="text-lg md:text-xl"
                            name="paymentMethod"
                            errors={
                              paymentMethodError
                                ? {
                                    paymentMethod: {
                                      message: paymentMethodError,
                                    },
                                  }
                                : undefined
                            }
                            hideErrorMessage
                          />
                        </div>
                      )}
                    </div>
                    {/* กินความกว้างเต็มกล่องเพื่อให้อยู่บรรทัดเดียว แล้วดันไปชิดขวา
                      จะได้อยู่ใต้ช่องที่ต้องแก้ ไม่ใช่ใต้ป้ายที่ไม่มีอะไรให้ทำ */}
                    <FieldErrorList
                      messages={[paymentMethodError]}
                      className="items-end"
                    />
                  </>
                )}
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

      <PartPreviewDialog
        part={previewItem ? toPreviewItem(previewItem) : null}
        price={previewItem ? Number(previewItem.unitPrice) : undefined}
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      />

      <ReceiptPreviewDialog
        repair={repair}
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
      />

      {hasCustomer && (
        <OrganizationTypeDialog
          isOpen={isOrgDialogOpen}
          // ปิดกล่องโดยไม่ตอบ = ยังไม่ลงเครดิต บิลอยู่สถานะเดิม
          onClose={() => {
            pendingCreditSkipRef.current = null;
            setIsOrgDialogOpen(false);
          }}
          customer={repair.customer}
          // อยู่ระหว่างลงเครดิต ข้อความแจ้งผลจะมาทีเดียวตอนลงเครดิตเสร็จ
          silent={pendingCreditSkipRef.current !== null}
          // บิลย้ายกองทันทีที่เปลี่ยนประเภท จึงพาไปที่กองใหม่เลย ไม่ใช่ค้างอยู่หน้าเดิม
          // แทนที่หน้าบิลในประวัติ กดย้อนกลับจะได้ถึงหน้าที่มาตั้งแต่แรก
          onSaved={(type) => {
            setIsOrgDialogOpen(false);

            // ถูกถามระหว่างกำลังลงเครดิต ตอบแล้วก็ลงเครดิตต่อให้จบ
            if (pendingCreditSkipRef.current !== null) {
              const skipToCompleted = pendingCreditSkipRef.current;
              pendingCreditSkipRef.current = null;
              creditTypeAnsweredRef.current = true;
              pendingCreditTypeRef.current = type;
              handleUpdateStatus(skipToCompleted);
              return;
            }

            // แก้ป้ายของลูกค้าเฉยๆ บิลที่เปิดอยู่ยังเป็นใบเดิม จึงอยู่หน้านี้ต่อ
            // โหลดใหม่เพื่อให้บรรทัดประเภทใต้ชื่อตรงกับที่เพิ่งเลือก
            changedTypeRef.current = type;
            fetchRepairDetail();
          }}
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
        // ไม่ได้ลบอะไร กดผิดก็แก้กลับได้ ไม่ต้องให้กดค้าง
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
    </div>
  );
};

export default RepairDetail;
