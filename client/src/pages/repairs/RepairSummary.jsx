import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import FormButton from "@/components/forms/FormButton";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import { updateRepair } from "@/api/repair";
import { toast } from "sonner";
import {
  Edit,
  ChevronLeft,
  SquareArrowLeft,
  SquareArrowRight,
  CircleEllipsis,
  Wrench,
} from "lucide-react";
import { provinces } from "@/utils/data";

const RepairSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { repairData, repairItems, editRepairId } = location.state || {};
  const origin = location.state?.origin || location.state?.from;
  const statusSlug = location.state?.statusSlug;
  const vehicleId = location.state?.vehicleId;

  // หากไม่มีข้อมูลให้กลับไปหน้าสร้างรายการซ่อมใหม่
  useEffect(() => {
    window.scrollTo(0, 0);

    if (!repairData || !repairItems) {
      navigate("/repair/new", { replace: true });
    }
  }, [repairData, repairItems, navigate]);

  if (!repairData || !repairItems) {
    return null;
  }

  const totalPrice = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0
  );

  // หาชื่อจังหวัดจาก ID
  const getProvinceName = (provinceId) => {
    const province = provinces.find((p) => p.id === provinceId);
    return province ? province.name : provinceId;
  };

  // แยกรายการซ่อมตามตำแหน่ง
  const getItemsBySide = (side) => {
    return repairItems.filter((item) => item.side === side);
  };

  const leftItems = getItemsBySide("left");
  const rightItems = getItemsBySide("right");
  const otherItems = getItemsBySide("other");
  const generalItems = repairItems.filter(
    (item) => !item.side || item.side === "general"
  );

  const handleConfirmRepair = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const repair = {
        fullName: repairData.fullName,
        address: repairData.address,
        phoneNumber: repairData.phoneNumber,
        brand: repairData.brand,
        model: repairData.model,
        plateNumber: `${repairData.plateLetters}-${repairData.plateNumbers}`,
        province: getProvinceName(repairData.province), // แปลง ID เป็นชื่อจังหวัด
        description: repairData.description,
        totalPrice: totalPrice,
        source: repairData.source,
        repairItems: repairItems.map((item) => {
          const isPart = !!(item.partNumber && item.brand);
          return {
            ...(isPart ? { partId: item.id } : { serviceId: item.id }),
            unitPrice: Number(item.sellingPrice),
            quantity: item.quantity,
            ...(item.side ? { side: item.side } : {}),
            // เก็บชื่อบริการที่แก้ชั่วคราวลง customName (เฉพาะค่าแรง)
            ...(!isPart && item.name ? { customName: item.name } : {}),
          };
        }),
      };

      if (editRepairId) {
        await updateRepair(editRepairId, repair);
        toast.success("บันทึกรายการซ่อมเรียบร้อยแล้ว");
        // หลังบันทึกในโหมดแก้ไข: ถ้ามี statusSlug ให้กลับหน้า RepairStatus
        if (statusSlug) {
          navigate(`/repair/status/${statusSlug}`);
        } else if (vehicleId) {
          // ถ้าไม่มี statusSlug แต่มี vehicleId แปลว่ามาจาก VehicleDetail
          navigate(`/vehicle/${vehicleId}`);
        } else if (origin === "repair-status") {
          // เผื่อกรณีมี origin แต่หลุด statusSlug
          navigate(`/repair/status/in-progress`);
        } else {
          // ดีฟอลต์ กลับไปหน้ารายละเอียดของงานซ่อมนี้
          navigate(`/repair/${editRepairId}`);
        }
      } else {
        await api.post("/api/repair", repair);
        toast.success("สร้างรายการซ่อมเรียบร้อยแล้ว");
        // โหมดสร้างใหม่ ไปหน้ารายการสถานะงานซ่อมตามเดิม
        navigate("/repair/status/in-progress");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    const from = location.state?.from;
    const backState = {
      repairData,
      repairItems,
      scrollToBottom: true,
      editRepairId,
      origin,
      statusSlug,
      vehicleId,
    };

    if (from === "suspension") {
      navigate("/inspections/suspension", { state: backState, replace: true });
    } else {
      navigate("/repair/new", { state: backState, replace: true });
    }
  };

  return (
    <div className="w-full h-[87px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] py-[18px]">
        <button
          onClick={() => handleGoBack()}
          className="mt-[2px] text-surface"
        >
          <ChevronLeft />
        </button>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          สรุปรายการซ่อม
        </p>
      </div>

      <div className="w-full h-full md:min-h-[calc(100vh-68px)] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="pt-[16px]">
          {/* ข้อมูลลูกค้า */}
          <div className="px-[20px]">
            <div className="mb-[16px]">
              <p className="mb-[8px] font-semibold text-[22px] md:text-[24px] text-normal">
                ข้อมูลลูกค้า
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    ชื่อลูกค้า:
                  </p>
                  <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                    {repairData.fullName || "ไม่ระบุ"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    หมายเลขโทรศัพท์:
                  </p>
                  <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                    {repairData.phoneNumber || "ไม่ระบุ"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    ที่อยู่:
                  </p>
                  <p className="max-w-[250px] font-semibold text-right text-[18px] md:text-[20px] text-normal break-words">
                    {repairData.address || "ไม่ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {/* ข้อมูลรถยนต์ */}
            <div className="mb-[16px]">
              <p className="mb-[8px] font-semibold text-[22px] md:text-[24px] text-normal">
                ข้อมูลรถยนต์
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    ยี่ห้อ-รุ่น:
                  </p>
                  <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                    {repairData.brand} {repairData.model}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    ทะเบียนรถ:
                  </p>
                  <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                    {repairData.plateLetters &&
                    repairData.plateNumbers &&
                    getProvinceName(repairData.province)
                      ? `${repairData.plateLetters}-${
                          repairData.plateNumbers
                        } ${getProvinceName(repairData.province)}`
                      : "ไม่ระบุ"}
                  </p>
                </div>
                <div className="flex justify-between items-start">
                  <p className="flex-shrink-0 font-medium text-[18px] md:text-[20px] text-subtle-dark">
                    รายละเอียดการซ่อม:
                  </p>
                  <p className="min-w-0 font-semibold text-right text-[18px] md:text-[20px] text-normal break-words leading-relaxed">
                    {repairData.description || "ไม่ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {/* รายการซ่อม */}
            <div className="mb-[16px]">
              <div className="flex justify-between items-center mb-[16px]">
                <p className="font-semibold text-[22px] md:text-[24px]">
                  รายการซ่อม
                </p>
                <button
                  onClick={() => handleGoBack()}
                  className="flex items-center gap-[4px] font-semibold text-[20px] md:text-[22px] text-primary hover:text-primary/80 cursor-pointer"
                >
                  <Edit className="w-5 h-5" />
                  แก้ไขรายการซ่อม
                </button>
              </div>

              {/* รายการฝั่งซ้าย */}
              {leftItems.length > 0 && (
                <div className="mb-[16px]">
                  <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                    <SquareArrowLeft className="mt-[2px]" />
                    รายการซ่อมฝั่งซ้าย
                  </p>
                  <div className="space-y-[12px]">
                    {leftItems.map((item, index) => (
                      <RepairItemCard
                        key={`left-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการฝั่งขวา */}
              {rightItems.length > 0 && (
                <div className="mb-[16px]">
                  <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                    <SquareArrowRight className="mt-[2px]" />
                    รายการซ่อมฝั่งขวา
                  </p>
                  <div className="space-y-[12px]">
                    {rightItems.map((item, index) => (
                      <RepairItemCard
                        key={`right-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการอื่นๆ */}
              {otherItems.length > 0 && (
                <div className="mb-[16px]">
                  <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                    <CircleEllipsis className="mt-[2px]" />
                    รายการซ่อมอื่นๆ
                  </p>
                  <div className="space-y-[12px]">
                    {otherItems.map((item, index) => (
                      <RepairItemCard
                        key={`other-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* รายการซ่อมเพิ่มเติม */}
            {generalItems.length > 0 && (
              <div className="mb-[16px]">
                {location.state?.from === "suspension" && (
                  <p className="flex items-center gap-[4px] mb-[8px] font-semibold text-[20px] md:text-[22px] text-primary">
                    <Wrench className="inline mb-[2px]" />
                    รายการซ่อมเพิ่มเติม
                  </p>
                )}
                <div className="space-y-[12px]">
                  {generalItems.map((item, index) => (
                    <RepairItemCard
                      key={`general-${index}`}
                      item={item}
                      variant="summary"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* สรุปยอดรวม */}
          <div className="p-[16px] mx-[20px] my-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <p className="font-semibold text-[20px] md:text-[22px] text-subtle-dark">
                  รวม {repairItems.length} รายการ
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold text-[24px] md:text-[26px] text-primary">
                  {formatCurrency(
                    repairItems.reduce(
                      (total, item) =>
                        total + item.sellingPrice * item.quantity,
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center pb-[112px]">
            <FormButton
              label={editRepairId ? "บันทึกรายการซ่อม" : "สร้างรายการซ่อม"}
              isLoading={isSubmitting}
              onClick={handleConfirmRepair}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairSummary;
