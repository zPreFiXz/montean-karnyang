import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { getRepairById, updateRepairStatus } from "@/api/repair";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  CreditCard,
  Clock,
  CheckCircle2,
  LoaderCircle,
  CircleUserRound,
  Image,
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

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repair, setRepair] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

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

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchRepairDetail();
  }, [id]);

  // ฟังก์ชันสำหรับแสดงข้อมูลสินค้า
  const renderProductInfo = (item) => {
    const isTire = item.part?.category?.name === "ยาง";

    // แสดงข้อมูลยางที่มีขนาดแก้มยาง
    if (
      isTire &&
      item.part?.typeSpecificData &&
      item.part.typeSpecificData.aspectRatio
    ) {
      return (
        <p className="font-semibold text-[14px] text-normal">
          {item.part.brand} {item.part.typeSpecificData.width}/
          {item.part.typeSpecificData.aspectRatio}R
          {item.part.typeSpecificData.rimDiameter} {item.part.name}
        </p>
      );
    }

    // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
    if (isTire && item.part?.typeSpecificData) {
      return (
        <p className="font-semibold text-[14px] text-normal">
          {item.part.brand} {item.part.typeSpecificData.width}R
          {item.part.typeSpecificData.rimDiameter} {item.part.name}
        </p>
      );
    }

    // แสดงข้อมูลอะไหล่หรือบริการ
    return (
      <p className="font-semibold text-[14px] text-normal">
        {item.part?.brand && `${item.part.brand} `}
        {item.part?.name || item.service?.name}
      </p>
    );
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return {
          text: "กำลังซ่อม",
          color: "text-[var(--color-in-progress)]",
          bg: "bg-[var(--color-in-progress)]",
          iconColor: "#f4b809",
          icon: Clock,
        };
      case "COMPLETED":
        return {
          text: "ซ่อมเสร็จสิ้น",
          color: "text-[var(--color-completed)]",
          bg: "bg-[var(--color-completed)]",
          iconColor: "#66bb6a",
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
    if (!repair || isUpdating) return;

    const nextStatus = skipToCompleted ? "PAID" : getNextStatus(repair.status);
    if (!nextStatus) return;

    const needsPaymentMethod =
      nextStatus === "PAID" ||
      (repair.status === "COMPLETED" && nextStatus === "PAID");

    try {
      setIsUpdating(true);

      const updateData = { status: nextStatus };
      if (needsPaymentMethod) {
        updateData.paymentMethod = selectedPaymentMethod;
      }

      const res = await updateRepairStatus(repair.id, nextStatus, updateData);
      setRepair(res.data);

      if (skipToCompleted) {
        toast.success("ซ่อมเสร็จสิ้นและชำระเงินแล้ว");
      } else if (nextStatus === "COMPLETED") {
        toast.success("ซ่อมเสร็จสิ้น");
      } else if (nextStatus === "PAID") {
        toast.success("ยืนยันการชำระเงินสำเร็จ");
      }

      // แปลงสถานะเป็น slug สำหรับ URL
      const statusSlug = nextStatus.toLowerCase().replace("_", "-");
      navigate(`/repair/status/${statusSlug}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusInfo = repair ? getStatusInfo(repair.status) : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="w-full h-[78px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] py-[16px]">
        <button onClick={() => navigate(-1)} className="mt-[2px] text-surface">
          <ChevronLeft />
        </button>
        <p className="font-semibold text-[22px] text-surface">
          รายละเอียดการซ่อม
        </p>
      </div>

      <div className="min-h-[calc(100vh-65px)] pt-[16px] pb-[88px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        {isLoading ? (
          <div className="flex justify-center items-center h-[579px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center px-[20px] mb-[16px]">
              <p
                className={`font-semibold text-[22px] leading-tight ${statusInfo.color}`}
              >
                รหัสการซ่อม: {repair.id}
              </p>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full ${statusInfo.bg}`}>
                  <StatusIcon size={18} className="text-surface" />
                </div>
                <p className={`text-[18px] font-semibold ${statusInfo.color}`}>
                  {statusInfo.text}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-[8px] px-[20px] my-[16px]">
              <div
                className={`flex justify-center items-center w-[45px] h-[45px] rounded-full ${statusInfo.bg}`}
              >
                <Car color={statusInfo.iconColor} />
              </div>
              <div className="flex flex-col">
                <p
                  className={`font-semibold text-[22px] ${statusInfo.color} leading-tight`}
                >
                  {repair.vehicle?.licensePlate
                    ? `${repair.vehicle.licensePlate.plateNumber} ${repair.vehicle.licensePlate.province}`
                    : "ไม่มีทะเบียน"}
                </p>
                <p className="font-medium text-[18px] text-subtle-dark leading-tight">
                  {repair.vehicle?.brand} {repair.vehicle?.model}
                </p>
              </div>
            </div>

            {repair.customer && (
              <div>
                <div className="flex items-center gap-[8px] px-[20px] mb-[16px]">
                  <div
                    className={`flex justify-center items-center w-[45px] h-[45px] rounded-full ${statusInfo.bg}`}
                  >
                    <CircleUserRound color="#ffffff" />
                  </div>
                  <div className="flex flex-col">
                    <p
                      className={`font-semibold text-[22px] ${statusInfo.color} leading-tight`}
                    >
                      {repair.customer.fullName || "ไม่ระบุชื่อ"}
                    </p>
                    <p className="font-medium text-[18px] text-subtle-dark leading-tight">
                      {repair.customer.phoneNumber || "ไม่ระบุเบอร์โทร"}
                      {repair.customer.address &&
                        ` | ${repair.customer.address}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {repair.repairItems && (
              <div className="px-[20px] mb-[16px]">
                <div className="flex justify-between items-center mb-[16px]">
                  <p className="font-semibold text-[18px] text-normal">
                    รายการซ่อม
                  </p>
                </div>
                <div className="space-y-[16px]">
                  {repair.repairItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-[16px]">
                      <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] shadow-primary">
                        <div className="flex items-center gap-[8px]">
                          <div className="flex items-center justify-center w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                            {item.part?.secureUrl ? (
                              <img
                                src={item.part.secureUrl}
                                alt={item.part.name}
                                className="object-cover w-full h-full rounded-[10px]"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-[60px] h-[60px] text-subtle-light">
                                <Image className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            {renderProductInfo(item)}
                            <p className="font-semibold text-[14px] text-subtle-dark">
                              {formatCurrency(Number(item.unitPrice))} ×{" "}
                              {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-[18px] text-primary text-nowrap">
                          {formatCurrency(
                            Number(item.unitPrice) * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-[16px] mx-[20px] mb-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <p className="font-semibold text-[18px] text-subtle-dark">
                    รวม {repair.repairItems?.length || 0} รายการ
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-semibold text-[22px] text-primary">
                    {formatCurrency(Number(repair.totalPrice))}
                  </p>
                </div>
              </div>
            </div>

            {repair.description && (
              <div className="px-[20px] mb-[16px]">
                <p className="mb-[16px] font-semibold text-[18px] text-normal">
                  รายละเอียดเพิ่มเติม
                </p>
                <div className="p-[16px] rounded-[10px] bg-gray-50">
                  <p className="font-medium text-[16px] text-normal leading-relaxed">
                    {repair.description}
                  </p>
                </div>
              </div>
            )}

            <div className="px-[20px] mb-[16px]">
              <p className="mb-[16px] font-semibold text-[18px] text-normal">
                การชำระเงิน
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    วิธีชำระเงิน:
                  </p>
                  {repair.status !== "PAID" ? (
                    <Select
                      value={selectedPaymentMethod}
                      onValueChange={(value) => setSelectedPaymentMethod(value)}
                    >
                      <SelectTrigger className="w-auto min-w-[120px] px-[12px] py-[8px] rounded-[20px] border font-medium text-[14px] text-normal bg-white focus:outline-none focus:ring-3 focus:ring-primary/20 focus:border-primary focus:border-2 ease-in-out duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-athiti font-medium">
                        <SelectItem className="text-[14px]" value="CASH">
                          เงินสด
                        </SelectItem>
                        <SelectItem
                          className="text-[14px]"
                          value="BANK_TRANSFER"
                        >
                          โอนเงิน
                        </SelectItem>
                        <SelectItem className="text-[14px]" value="CREDIT_CARD">
                          บัตรเครดิต
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium text-[16px] text-normal">
                      {getPaymentMethodText(repair.paymentMethod)}
                    </p>
                  )}
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    สถานะ:
                  </p>
                  <p
                    className={`font-medium text-[16px] ${
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
              <p className="mb-[16px] font-semibold text-[18px] text-normal">
                เวลาดำเนินการ
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    เริ่มซ่อม:
                  </p>
                  <p className="font-medium text-[16px] text-normal">
                    {formatDate(repair.createdAt)} |{" "}
                    {formatTime(repair.createdAt)} น.
                  </p>
                </div>
                {repair.completedAt && (
                  <div className="flex justify-between">
                    <p className="font-medium text-[16px] text-subtle-dark">
                      ซ่อมเสร็จ:
                    </p>
                    <p className="font-medium text-[16px] text-normal">
                      {formatDate(repair.completedAt)} |{" "}
                      {formatTime(repair.completedAt)} น.
                    </p>
                  </div>
                )}
                {repair.paidAt && (
                  <div className="flex justify-between">
                    <p className="font-medium text-[16px] text-subtle-dark">
                      ชำระเงิน:
                    </p>
                    <p className="font-medium text-[16px] text-normal">
                      {formatDate(repair.paidAt)} | {formatTime(repair.paidAt)}{" "}
                      น.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {repair.user && (
              <div className="px-[20px] mb-[16px]">
                <p className="mb-[16px] font-semibold text-[18px] text-normal">
                  ผู้รับซ่อม
                </p>
                <div className="p-[16px] rounded-[10px] bg-gray-50">
                  <p className="font-medium text-[16px] text-normal">
                    {repair.user.fullName} ({repair.user.nickname})
                  </p>
                </div>
              </div>
            )}

            {getNextStatus(repair.status) && (
              <div className="flex flex-col pr-[40px]">
                <FormButton
                  label={getNextStatusText(repair.status)}
                  isLoading={isUpdating}
                  onClick={() => handleUpdateStatus(false)}
                  className={getNextStatusButtonClass(repair.status)}
                />

                {/* ปุ่มข้ามขั้นตอนสำหรับสถานะ IN_PROGRESS */}
                {repair.status === "IN_PROGRESS" && (
                  <FormButton
                    label="เสร็จสิ้นการซ่อม + ยืนยันการชำระเงิน"
                    isLoading={isUpdating}
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
