import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { getRepairById, updateRepairStatus } from "@/api/repair";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  CreditCard,
  Clock,
  CheckCircle2,
  LoaderCircle,
  CircleUserRound,
  MapPin,
  Phone,
  Edit,
  SquareArrowLeft,
  SquareArrowRight,
  CircleEllipsis,
  Wrench,
} from "lucide-react";
import { Car } from "@/components/icons/Icon";
import FormButton from "@/components/forms/FormButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { provinces } from "@/utils/data";

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [repair, setRepair] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingSkip, setIsUpdatingSkip] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchRepairDetail();
  }, [id]);

  const fetchRepairDetail = async () => {
    try {
      const res = await getRepairById(id);
      setRepair(res.data);
      setSelectedPaymentMethod(res.data.paymentMethod);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultStatusInfo = {
    text: "ไม่ทราบสถานะ",
    color: "text-subtle-dark",
    bg: "bg-gray-200",
    iconColor: "#6b7280",
    icon: CircleEllipsis,
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return {
          text: "กำลังซ่อม",
          color: "text-[var(--color-in-progress)]",
          bg: "bg-[var(--color-in-progress)]",
          iconColor: "#ffb000",
          icon: Clock,
        };
      case "COMPLETED":
        return {
          text: "ซ่อมเสร็จสิ้น",
          color: "text-[var(--color-completed)]",
          bg: "bg-[var(--color-completed)]",
          iconColor: "#22c55e",
          icon: CheckCircle2,
        };
      case "PAID":
        return {
          text: "ชำระเงินแล้ว",
          color: "text-[var(--color-paid)]",
          bg: "bg-[var(--color-paid)]",
          iconColor: "#1976d2",
          icon: CreditCard,
        };
    }
    return defaultStatusInfo;
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "CASH":
        return "เงินสด";
      case "BANK_TRANSFER":
        return "โอนเงิน";
      case "CREDIT_CARD":
        return "บัตรเครดิต";
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "IN_PROGRESS":
        return "COMPLETED";
      case "COMPLETED":
        return "PAID";
    }
  };

  const getNextStatusText = (currentStatus) => {
    switch (currentStatus) {
      case "IN_PROGRESS":
        return "เสร็จสิ้นการซ่อม";
      case "COMPLETED":
        return "ยืนยันการชำระเงิน";
    }
  };

  const getNextStatusButtonClass = (currentStatus) => {
    switch (currentStatus) {
      case "IN_PROGRESS":
        return "bg-completed";
      case "COMPLETED":
        return "bg-paid";
    }
  };

  const handleUpdateStatus = async (skipToCompleted = false) => {
    if (!repair) return;

    // ตรวจสอบว่าปุ่มที่กดกำลัง loading อยู่หรือไม่
    if (skipToCompleted && isUpdatingSkip) return;
    if (!skipToCompleted && isUpdating) return;

    const nextStatus = skipToCompleted ? "PAID" : getNextStatus(repair.status);
    if (!nextStatus) return;

    const needsPaymentMethod =
      nextStatus === "PAID" ||
      (repair.status === "COMPLETED" && nextStatus === "PAID");

    try {
      if (skipToCompleted) {
        setIsUpdatingSkip(true);
      } else {
        setIsUpdating(true);
      }

      const updateData = { nextStatus: nextStatus };

      if (needsPaymentMethod) {
        updateData.paymentMethod = selectedPaymentMethod;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await updateRepairStatus(repair.id, updateData);
      setRepair(res.data);

      if (skipToCompleted) {
        toast.success("ซ่อมเสร็จสิ้นและชำระเงินเรียบร้อยแล้ว");
      } else if (nextStatus === "COMPLETED") {
        toast.success("ซ่อมเสร็จเรียบร้อยแล้ว");
      } else if (nextStatus === "PAID") {
        toast.success("ชำระเงินเรียบร้อยแล้ว");
      }

      // แปลงสถานะเป็น slug สำหรับ URL
      const statusSlug = nextStatus.toLowerCase().replace("_", "-");
      navigate(`/repair/status/${statusSlug}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
      setIsUpdatingSkip(false);
    }
  };

  const statusInfo = getStatusInfo(repair?.status) ?? defaultStatusInfo;
  const StatusIcon = statusInfo?.icon;

  const getProvinceIdByName = (name) => {
    const found = provinces.find((p) => p.name === name);
    return found ? found.id : "";
  };

  const handleEditRepair = () => {
    if (!repair) return;

    // เตรียมข้อมูลฟอร์ม
    const plate = repair?.vehicle?.licensePlate?.plateNumber || ""; // รูปแบบเช่น กก-1234
    const [plateLetters = "", plateNumbers = ""] = plate.split("-");
    const provinceName = repair?.vehicle?.licensePlate?.province || "";

    const repairData = {
      fullName: repair?.customer?.fullName || "",
      address: repair?.customer?.address || "",
      phoneNumber: repair?.customer?.phoneNumber || "",
      brand: repair?.vehicle?.vehicleBrandModel?.brand || "",
      model: repair?.vehicle?.vehicleBrandModel?.model || "",
      plateLetters,
      plateNumbers,
      province: getProvinceIdByName(provinceName),
      description: repair?.description || "",
    };

    // รวมจำนวนที่ถูกใช้ต่ออะไหล่ เพื่อคืนสต็อกในโหมดแก้ไข (ฝั่ง UI เท่านั้น)
    const usedQtyByPartId = (repair?.repairItems || []).reduce((acc, ri) => {
      if (ri.part?.id) {
        acc[ri.part.id] = (acc[ri.part.id] || 0) + (ri.quantity || 1);
      }
      return acc;
    }, {});

    // แปลงรายการซ่อมจากรูปแบบ DB -> รูปแบบหน้าสร้าง/ช่วงล่าง
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
          stockQuantity: restoredStock,
          unit: ri.part.unit,
          category: ri.part.category,
          secureUrl: ri.part.secureUrl || null,
          typeSpecificData: ri.part.typeSpecificData || null,
          quantity: ri.quantity || 1,
          side: ri.side, // เพิ่ม side จาก database
        };
      }
      // เป็นบริการ
      return {
        id: ri.service?.id,
        brand: "",
        name: ri.customName || ri.service?.name || "",
        sellingPrice: Number(ri.unitPrice),
        category: ri.service?.category,
        secureUrl: null,
        quantity: ri.quantity || 1,
        side: ri.side, // เพิ่ม side จาก database
      };
    });

    if (repair.source === "SUSPENSION") {
      const savedItems = [];

      // แยกชิ้นส่วนช่วงล่าง และทำ grouping สำหรับชิ้นส่วนที่เป็น left-right (อาจถูกบันทึกเป็นหลายแถว qty=1)
      const lrGroups = {};

      normalizedItems.forEach((item) => {
        const st = item?.typeSpecificData?.suspensionType;
        const itemSide = item.side;

        // ถ้าไม่มี typeSpecificData หรือมี side เป็น null -> รายการซ่อมเพิ่มเติม
        if (!st || itemSide === null) {
          savedItems.push({ ...item });
          return;
        }

        // ถ้ามี side ชัดเจนจาก database ให้ใช้ตามนั้น
        if (
          itemSide === "left" ||
          itemSide === "right" ||
          itemSide === "other"
        ) {
          savedItems.push({ ...item, side: itemSide });
          return;
        }

        if (st === "left-right") {
          // group โดยใช้ part.id และ unitPrice เพื่อรวมจำนวนทั้งหมดเข้าด้วยกัน
          const key = `${item.id}-${item.sellingPrice}`;
          if (!lrGroups[key]) {
            lrGroups[key] = { base: item, count: 0 };
          }
          lrGroups[key].count += item.quantity || 1;
          return;
        }

        if (["left", "right", "other"].includes(st)) {
          // ให้แต่ละแถวเป็น qty=1 และระบุด้านชัดเจน
          const count = item.quantity || 1;
          for (let i = 0; i < count; i++) {
            savedItems.push({ ...item, quantity: 1, side: st });
          }
          return;
        }

        // กรณีอื่นๆ ใส่เป็นรายการทั่วไป
        savedItems.push({ ...item });
      });

      // กระจายซ้าย-ขวาสำหรับกลุ่ม left-right ตามจำนวนรวม
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
          scrollToBottom: true,
          editRepairId: repair.id,
          from: location.state?.from,
          statusSlug: location.state?.statusSlug,
          vehicleId: location.state?.vehicleId,
        },
      });
      return;
    }

    // กรณีทั่วไป กลับไปหน้า "รายการซ่อมใหม่"
    navigate("/repair/new", {
      state: {
        repairData: { ...repairData },
        repairItems: normalizedItems,
        scrollToBottom: true,
        editRepairId: repair.id,
        from: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
      },
    });
  };

  const handleGoBack = () => {
    // ถ้ามาจาก SalesReport ให้กลับไปพร้อมข้อมูลวันที่
    if (
      location.state?.returnTo &&
      location.state.returnTo.includes("/reports/sales/")
    ) {
      navigate(location.state.returnTo, {
        state: { currentDate: location.state.currentDate },
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full h-[87px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] py-[18px]">
        <button onClick={handleGoBack} className="mt-[2px] text-surface">
          <ChevronLeft />
        </button>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          รายละเอียดการซ่อม
        </p>
      </div>

      <div className="min-h-[calc(100vh-65px)] pt-[16px] pb-[96px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        {isLoading ? (
          <div className="flex justify-center items-center h-[579px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center px-[20px] mb-[16px]">
              <p
                className={`font-semibold text-[22px] md:text-[24px] leading-tight ${statusInfo.color}`}
              >
                รหัสการซ่อม: {repair.id}
              </p>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full ${statusInfo.bg}`}>
                  <StatusIcon size={18} className="text-surface" />
                </div>
                <p
                  className={`text-[20px] md:text-[22px] font-semibold ${statusInfo.color}`}
                >
                  {statusInfo.text}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-[8px] px-[20px] my-[16px]">
              <div
                className={`flex justify-center items-center w-[45px] h-[45px] aspect-square rounded-full ${statusInfo.bg}`}
              >
                <Car color={statusInfo.iconColor} />
              </div>
              <div className="flex flex-col">
                <p
                  className={`font-semibold text-[22px] md:text-[24px] ${statusInfo.color} leading-tight`}
                >
                  {repair?.vehicle?.licensePlate?.plateNumber &&
                  repair?.vehicle?.licensePlate?.province
                    ? `${repair.vehicle.licensePlate.plateNumber} ${repair.vehicle.licensePlate.province}`
                    : "ไม่ระบุทะเบียนรถ"}
                </p>
                <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark leading-tight">
                  {repair.vehicle?.vehicleBrandModel.brand}{" "}
                  {repair.vehicle?.vehicleBrandModel.model}
                </p>
              </div>
            </div>

            {repair.customer && (
              <div>
                <div className="flex items-start gap-[8px] px-[20px] mb-[16px]">
                  <div
                    className={`flex justify-center items-center w-[45px] h-[45px] mt-[6px] aspect-square rounded-full ${statusInfo.bg}`}
                  >
                    <CircleUserRound color="#ffffff" />
                  </div>
                  {repair.customer.fullName &&
                  !repair.customer.phoneNumber &&
                  !repair.customer.address ? (
                    <div className="flex items-center justify-center h-[45px] mt-[4px]">
                      <p
                        className={`font-semibold text-[22px] md:text-[24px] ${statusInfo.color} leading-tight`}
                      >
                        {repair.customer.fullName}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {repair.customer.fullName && (
                        <p
                          className={`font-semibold text-[22px] md:text-[24px] ${statusInfo.color} leading-tight`}
                        >
                          {repair.customer.fullName}
                        </p>
                      )}
                      <div className="flex flex-wrap items-start gap-[8px] mt-[4px]">
                        {repair.customer.phoneNumber && (
                          <div className="flex-shrink-0 flex items-center gap-[4px]">
                            <Phone size={16} className="text-subtle-dark" />
                            <a
                              href={`tel:${repair.customer.phoneNumber}`}
                              className="font-medium text-[18px] md:text-[20px] text-subtle-dark leading-tight underline decoration-dashed"
                            >
                              {repair.customer.phoneNumber}
                            </a>
                          </div>
                        )}
                        {repair.customer.address && (
                          <div className="flex items-start gap-[4px]">
                            <MapPin
                              size={16}
                              className="flex-shrink-0 text-subtle-dark mt-[2px]"
                            />
                            <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark leading-tight">
                              {repair.customer.address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {repair.repairItems && (
              <div className="px-[20px] mb-[16px]">
                <div className="flex justify-between items-center mb-[8px]">
                  <p className="font-semibold text-[22px] md:text-[24px] text-normal">
                    รายการซ่อม
                  </p>
                  <button
                    onClick={handleEditRepair}
                    className="flex items-center gap-[4px] font-semibold text-[20px] md:text-[22px] text-primary hover:text-primary/80 cursor-pointer"
                  >
                    <Edit className="w-5 h-5" />
                    แก้ไขรายการซ่อม
                  </button>
                </div>

                {repair.source === "SUSPENSION" ? (
                  <div className="space-y-[16px]">
                    {(() => {
                      const suspensionItems = (repair.repairItems || []).filter(
                        (ri) =>
                          ri.part?.typeSpecificData?.suspensionType || ri.side
                      );
                      const generalItems = (repair.repairItems || []).filter(
                        (ri) =>
                          !ri.part?.typeSpecificData?.suspensionType && !ri.side
                      );

                      const leftItems = [];
                      const rightItems = [];
                      const otherItems = [];

                      // กลุ่มชิ้นส่วนที่เป็น left-right เพื่อจับคู่ซ้าย-ขวา (เมื่อไม่มี side ใน DB)
                      const lrGroups = {};

                      suspensionItems.forEach((ri) => {
                        // ถ้ามี side ใน DB ให้ใช้เลย
                        if (ri.side === "left") {
                          leftItems.push(ri);
                          return;
                        }
                        if (ri.side === "right") {
                          rightItems.push(ri);
                          return;
                        }
                        if (ri.side === "other") {
                          otherItems.push(ri);
                          return;
                        }

                        const st = ri.part.typeSpecificData.suspensionType;
                        const qty = ri.quantity || 1;
                        if (st === "left-right") {
                          const key = `${ri.part.id}-${ri.unitPrice}`;
                          if (!lrGroups[key]) {
                            lrGroups[key] = { base: ri, count: 0 };
                          }
                          lrGroups[key].count += qty;
                          return;
                        }
                        if (st === "left") {
                          leftItems.push(ri);
                          return;
                        }
                        if (st === "right") {
                          rightItems.push(ri);
                          return;
                        }
                        if (st === "other") {
                          otherItems.push(ri);
                          return;
                        }
                        otherItems.push(ri);
                      });

                      // จับคู่ซ้าย-ขวาสำหรับชิ้นส่วนที่เป็น left-right
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

                      return (
                        <div>
                          {leftItems.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                                <SquareArrowLeft className="mt-[2px]" />
                                รายการซ่อมฝั่งซ้าย
                              </p>
                              <div className="space-y-[12px]">
                                {leftItems.map((item, idx) => (
                                  <RepairItemCard
                                    key={`left-${idx}`}
                                    item={item}
                                    variant="detail"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {rightItems.length > 0 && (
                            <div className="mb-[8px]">
                              <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                                <SquareArrowRight className="mt-[2px]" />
                                รายการซ่อมฝั่งขวา
                              </p>
                              <div className="space-y-[12px]">
                                {rightItems.map((item, idx) => (
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
                              <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                                <CircleEllipsis className="mt-[2px]" />
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
                              <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
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

            <div className="p-[16px] mx-[20px] mb-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <p className="font-semibold text-[20px] md:text-[22px] text-subtle-dark">
                    รวม {repair.repairItems?.length || 0} รายการ
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-semibold text-[24px] md:text-[26px] text-primary">
                    {formatCurrency(Number(repair.totalPrice))}
                  </p>
                </div>
              </div>
            </div>

            {repair.description && (
              <div className="px-[20px] mb-[16px]">
                <p className="mb-[16px] font-semibold text-[22px] md:text-[24px] text-normal">
                  รายละเอียดเพิ่มเติม
                </p>
                <div className="p-[16px] rounded-[10px] bg-gray-50">
                  <p className="font-medium text-[18px] md:text-[20px] text-normal leading-relaxed">
                    {repair.description}
                  </p>
                </div>
              </div>
            )}

            <div className="px-[20px] mb-[16px]">
              <p className="mb-[8px] font-semibold text-[22px] md:text-[24px] text-normal">
                การชำระเงิน
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    วิธีชำระเงิน:
                  </p>
                  {repair.status !== "PAID" ? (
                    <Select
                      value={selectedPaymentMethod}
                      onValueChange={(value) => setSelectedPaymentMethod(value)}
                    >
                      <SelectTrigger className="w-auto min-w-[140px] px-[12px] py-[8px] rounded-[20px] border font-medium text-[18px] text-normal bg-white focus:outline-none focus:ring-3 focus:ring-primary/20 focus:border-primary focus:border-2 ease-in-out duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-athiti font-medium">
                        <SelectItem
                          className="text-[18px] md:text-[20px]"
                          value="CASH"
                        >
                          เงินสด
                        </SelectItem>
                        <SelectItem
                          className="text-[18px] md:text-[20px]"
                          value="BANK_TRANSFER"
                        >
                          โอนเงิน
                        </SelectItem>
                        <SelectItem
                          className="text-[18px] md:text-[20px]"
                          value="CREDIT_CARD"
                        >
                          บัตรเครดิต
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                      {getPaymentMethodText(repair.paymentMethod)}
                    </p>
                  )}
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    สถานะ:
                  </p>
                  <p
                    className={`font-semibold text-[18px] md:text-[20px] ${
                      repair.paidAt
                        ? "text-[var(--color-paid)]"
                        : "text-[var(--color-in-progress)]"
                    }`}
                  >
                    {repair.paidAt ? "ชำระเงินแล้ว" : "รอชำระเงิน"}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-[20px] mb-[16px]">
              <p className="mb-[8px] font-semibold text-[22px] md:text-[24px] text-normal">
                เวลาดำเนินการ
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    เริ่มซ่อม:
                  </p>
                  <p className="font-medium text-[18px] md:text-[20px] text-normal">
                    {formatDate(repair.createdAt)} |{" "}
                    {formatTime(repair.createdAt)} น.
                  </p>
                </div>
                {repair.completedAt && (
                  <div className="flex justify-between">
                    <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                      ซ่อมเสร็จ:
                    </p>
                    <p className="font-medium text-[18px] md:text-[20px] text-normal">
                      {formatDate(repair.completedAt)} |{" "}
                      {formatTime(repair.completedAt)} น.
                    </p>
                  </div>
                )}
                {repair.paidAt && (
                  <div className="flex justify-between">
                    <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                      ชำระเงิน:
                    </p>
                    <p className="font-medium text-[18px] md:text-[20px] text-normal">
                      {formatDate(repair.paidAt)} | {formatTime(repair.paidAt)}{" "}
                      น.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {repair.user && (
              <div className="px-[20px] mb-[16px]">
                <p className="mb-[8px] font-semibold text-[22px] md:text-[24px] text-normal">
                  ผู้รับงานซ่อม
                </p>
                <div className="p-[16px] rounded-[10px] bg-gray-50">
                  <p className="font-medium text-[18px] md:text-[20px] text-normal">
                    {repair.user.fullName} ({repair.user.nickname})
                  </p>
                </div>
              </div>
            )}

            {getNextStatus(repair.status) && (
              <div className="flex flex-col gap-[16px] pr-[40px] mb-[16px]">
                <FormButton
                  label={getNextStatusText(repair.status)}
                  isLoading={isUpdating}
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(false)}
                  className={getNextStatusButtonClass(repair.status)}
                />

                {/* ปุ่มข้ามขั้นตอนสำหรับสถานะ IN_PROGRESS */}
                {repair.status === "IN_PROGRESS" && (
                  <FormButton
                    label="เสร็จสิ้นการซ่อม + ยืนยันการชำระเงิน"
                    isLoading={isUpdatingSkip}
                    disabled={isUpdatingSkip}
                    onClick={() => handleUpdateStatus(true)}
                    className="bg-paid mt-0"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairDetail;
