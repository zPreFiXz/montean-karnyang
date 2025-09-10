import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import FormButton from "@/components/forms/FormButton";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { Edit, ChevronLeft } from "lucide-react";
import { provinces } from "@/utils/data";

const RepairSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { repairData, repairItems } = location.state || {};

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

  const handleConfirmRepair = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await api.post("/api/repair", {
        fullName: repairData.fullName,
        address: repairData.address,
        phoneNumber: repairData.phoneNumber,
        brand: repairData.brand,
        model: repairData.model,
        plateNumber: `${repairData.plateLetters}-${repairData.plateNumbers}`,
        province: getProvinceName(repairData.province), // แปลง ID เป็นชื่อจังหวัด
        description: repairData.description,
        totalPrice: totalPrice,
        repairItems: repairItems.map((item) => ({
          ...(item.partNumber && item.brand
            ? { partId: item.id }
            : { serviceId: item.id }),
          unitPrice: Number(item.sellingPrice),
          quantity: item.quantity,
        })),
      });

      toast.success("สร้างรายการซ่อมเรียบร้อยแล้ว");

      navigate("/repair/status/in-progress");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate("/repair/new", {
      state: { repairData, repairItems, scrollToBottom: true },
      replace: true,
    });
  };

  return (
    <div className="w-full h-full bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
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
      <div className="w-full h-full md:min-h-[calc(100vh-68px)]  mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="pt-[16px]">
          {/* ข้อมูลลูกค้า */}
          <div className="px-[20px]">
            <div className="mb-[16px]">
              <p className="mb-[16px] font-semibold text-[22px] md:text-[24px] text-normal">
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
              <p className="mb-[12px] font-semibold text-[22px] md:text-[24px] text-normal">
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
                    {repairData.plateLetters}-{repairData.plateNumbers}{" "}
                    {getProvinceName(repairData.province)}
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
              <div className="space-y-[12px]">
                {repairItems.map((item, index) => (
                  <RepairItemCard key={index} item={item} variant="summary" />
                ))}
              </div>
            </div>
          </div>

          {/* สรุปยอดรวม */}
          <div className="p-[16px] mx-[20px] mt-[20px] mb-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
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
              label="สร้างรายการซ่อม"
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
