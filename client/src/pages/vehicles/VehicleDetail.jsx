import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, LoaderCircle, Trash2, Wrench } from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import { getVehicle, deleteVehicle } from "@/api/vehicle";
import { formatDate } from "@/utils/formats";
import RepairCard from "@/components/cards/RepairCard";
import { toastError } from "@/utils/handleError";
import { toast } from "sonner";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { getDisplayBrand } from "@/utils/repairDisplay";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const hasRepairs = !!vehicle?.repairs?.length;

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleDetail();
  }, [id]);

  const handleDeleteVehicle = async () => {
    await deleteVehicle(id);
    toast.success("ลบรถเรียบร้อยแล้ว");
    setIsDeleteConfirmOpen(false);
    navigate("/vehicles");
  };

  const fetchVehicleDetail = async () => {
    setIsLoading(true);
    try {
      const res = await getVehicle(id);
      setVehicle(res.data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] py-[18px]">
        <button
          onClick={() => navigate("/vehicles")}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          ประวัติรถ
        </p>
        {/* ลบได้เฉพาะรถที่ไม่เหลือบิลแล้ว เช่นเผลอสร้างบิลผิดทะเบียนแล้วลบบิลทิ้ง */}
        {!isLoading && !hasRepairs && (
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            aria-label="ลบรถ"
            className="bg-destructive flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <Trash2 className="text-surface h-5 w-5" />
          </button>
        )}
      </div>
      <div className="bg-surface shadow-primary flex flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-[16px] pb-[96px]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="mb-[16px] flex items-center gap-[8px] px-[20px]">
              <div className="bg-primary flex h-[45px] w-[45px] items-center justify-center rounded-full">
                <BrandIcons brand={vehicle?.vehicleModel.brand} />
              </div>
              <div className="flex flex-col">
                <p className="text-primary text-[22px] leading-tight font-semibold md:text-2xl">
                  {vehicle?.licensePlate?.plateNumber &&
                  vehicle?.licensePlate?.province
                    ? `${vehicle.licensePlate.plateNumber} ${vehicle.licensePlate.province}`
                    : "ไม่ระบุทะเบียนรถ"}
                </p>
                <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                  {getDisplayBrand(vehicle?.vehicleModel)}
                </p>
              </div>
            </div>
            <div className="mb-[16px] flex flex-1 flex-col px-[20px]">
              <div className="mb-[8px] flex items-center justify-between">
                <p className="text-normal text-[22px] font-semibold md:text-2xl">
                  ประวัติการซ่อม
                </p>
              </div>
              {/* ลบบิลใบสุดท้ายทิ้งได้ รถยังอยู่ในระบบ ต้องบอกว่าไม่มีประวัติ ไม่ใช่ปล่อยว่าง */}
              {!vehicle.repairs?.length ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                    ไม่มีประวัติการซ่อม
                  </p>
                </div>
              ) : (
                <div className="space-y-[16px]">
                  {vehicle.repairs.map((item) => (
                    <Link
                      key={item.id}
                      to={`/repairs/${item.id}`}
                      state={{ from: "vehicle-detail", vehicleId: id }}
                      className="block"
                    >
                      <RepairCard
                        icon={Wrench}
                        itemCount={item.repairItems?.length}
                        customerName={item.customer?.name}
                        dateText={formatDate(item.createdAt)}
                        price={Number(item.totalPrice) || 0}
                        status={item.status}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteVehicle}
        title="ยืนยันการลบรถ"
        itemName={
          vehicle?.licensePlate?.plateNumber
            ? `${vehicle.licensePlate.plateNumber} ${vehicle.licensePlate.province}`
            : "ไม่ระบุทะเบียนรถ"
        }
        itemDetail={getDisplayBrand(vehicle?.vehicleModel)}
      />
    </div>
  );
};

export default VehicleDetail;
