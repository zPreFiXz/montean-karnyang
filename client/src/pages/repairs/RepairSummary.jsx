import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import FormButton from "@/components/forms/FormButton";
import api from "@/lib/api";
import { toast } from "sonner";
import { Image, Edit } from "lucide-react";

const RepairSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { repairData, repairItems } = location.state || {};

  // หากไม่มีข้อมูลให้กลับไปหน้าสร้างรายการซ่อมใหม่
  //   if (!repairData || !repairItems) {
  //     navigate("/repairs/new", { replace: true });
  //     return null;
  //   }

  const totalPrice = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0
  );

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
        province: repairData.province,
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

      toast.success("เริ่มดำเนินการซ่อมเรียบร้อยแล้ว");

      navigate("/repairs/status/in-progress");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate("/repairs/new", {
      state: { repairData, repairItems, scrollToBottom: true },
      replace: true,
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full h-full bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        สรุปรายการซ่อม
      </p>
      <div className="w-full h-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="pt-[16px]">
          {/* ข้อมูลลูกค้า */}
          <div className="px-[20px]">
            <div className="mb-[16px]">
              <p className="font-semibold text-[18px] text-normal mb-[16px]">
                ข้อมูลลูกค้า
              </p>
              <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    ชื่อลูกค้า:
                  </p>
                  <p className="font-medium text-[16px] text-normal">
                    {repairData.fullName || "ไม่ระบุ"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    หมายเลขโทรศัพท์:
                  </p>
                  <p className="font-medium text-[16px] text-normal">
                    {repairData.phoneNumber || "ไม่ระบุ"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    ที่อยู่:
                  </p>
                  <p className="font-medium text-[16px] text-normal text-right max-w-[250px] break-words">
                    {repairData.address || "ไม่ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {/* ข้อมูลรถยนต์ */}
            <div className="mb-[16px]">
              <h3 className="font-semibold text-[18px] text-normal mb-[12px]">
                ข้อมูลรถยนต์
              </h3>
              <div className="p-[16px] rounded-[10px] bg-gray-50 space-y-[8px]">
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    ยี่ห้อ-รุ่น:
                  </p>
                  <p className="font-medium text-[16px] text-normal">
                    {repairData.brand} {repairData.model}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-medium text-[16px] text-subtle-dark">
                    ทะเบียนรถ:
                  </p>
                  <p className="font-medium text-[16px] text-normal">
                    {repairData.plateLetters}-{repairData.plateNumbers}{" "}
                    {repairData.province}
                  </p>
                </div>
                <div className="flex justify-between items-start">
                  <p className="font-medium text-[16px] text-subtle-dark flex-shrink-0">
                    รายละเอียดการซ่อม:
                  </p>
                  <p className="font-medium text-[16px] text-normal text-right break-words min-w-0 leading-relaxed">
                    {repairData.description || "ไม่ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {/* รายการซ่อม */}
            <div className="mb-[16px]">
              <div className="flex justify-between items-center mb-[16px]">
                <p className="font-semibold text-[22px]">รายการซ่อม</p>
                <button
                  onClick={() => handleGoBack()}
                  className="flex items-center gap-[4px] font-semibold text-[18px] text-primary hover:text-primary/80 cursor-pointer"
                >
                  <Edit className="w-5 h-5" />
                  แก้ไขรายการซ่อม
                </button>
              </div>
              <div className="space-y-[12px]">
                {repairItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-[16px]">
                    <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
                      <div className="flex items-center gap-[8px]">
                        <div className="flex items-center justify-center w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                          {item.secureUrl ? (
                            <img
                              src={item.secureUrl}
                              alt={item.name}
                              className="object-cover w-full h-full rounded-[10px]"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-[60px] h-[60px] text-subtle-light">
                              <Image className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-semibold text-[14px] text-normal">
                            {item.brand
                              ? `${item.brand} ${item.name}`
                              : item.name}
                          </p>
                          <p className="font-semibold text-[14px] text-subtle-dark">
                            {Number(item.sellingPrice).toLocaleString()} บาท ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-[18px] text-primary text-nowrap">
                        {(item.quantity * item.sellingPrice).toLocaleString()}{" "}
                        บาท
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* สรุปยอดรวม */}
          <div className="mx-[20px] mt-[20px] p-[16px] rounded-[12px] bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <p className="font-semibold text-[18px] text-subtle-dark">
                  รวม {repairItems.length} รายการ
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold text-[22px] text-primary">
                  {repairItems
                    .reduce(
                      (total, item) =>
                        total + item.sellingPrice * item.quantity,
                      0
                    )
                    .toLocaleString()}{" "}
                  บาท
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center pb-[88px]">
            <FormButton
              label="ดำเนินการซ่อม"
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
