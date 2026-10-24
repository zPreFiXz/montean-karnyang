import PageSpinner from "@/components/ui/PageSpinner";
import { countDisplayedItems } from "@/utils/repairItemGroups";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, Trash2, Wrench } from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import { getVehicle, deleteVehicle } from "@/api/vehicle";
import { formatDate, formatPlate } from "@/utils/formats";
import RepairCard from "@/components/cards/RepairCard";
import { toastError } from "@/utils/handleError";
import { toast } from "sonner";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { getDisplayBrand, getVehicleSubtitle } from "@/utils/repairDisplay";

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

  // ไม่เติมข้อมูลลูกค้า เพราะคนเอารถมาครั้งนี้อาจไม่ใช่คนเดิม
  const startNewBill = (path) => {
    const plate = vehicle?.licensePlate?.plateNumber || "";
    const [plateLetters = "", plateNumbers = ""] = plate.split(/[\s-]+/);
    navigate(path, {
      state: {
        repairData: {
          brand: vehicle?.vehicleModel?.brand || "",
          model: vehicle?.vehicleModel?.model || "",
          plateLetters,
          plateNumbers,
          province: vehicle?.licensePlate?.province || "",
          fleetNo: vehicle?.fleetNo || "",
        },
        repairItems: [],
        hideMoreFields: true,
        // บิลช่วงล่างใบใหม่ต้องได้ค่าแรงกับตั้งศูนย์เหมือนเปิดจากเมนู
        addSuspensionDefaults: true,
        vehicleId: id,
        backIdx:
          typeof window.history.state?.idx === "number"
            ? window.history.state.idx - 1
            : null,
      },
    });
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
      <div className="flex items-center gap-2 px-5 py-4.5">
        <button
          // ถอยประวัติ ให้หน้ารายการได้คำค้นกับตำแหน่งคืน (เปิดลิงก์ตรงๆ ไม่มีประวัติ จึงมีเส้นทางสำรอง)
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/vehicles")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          ประวัติรถ
        </p>
        {!isLoading && !hasRepairs && (
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            aria-label="ลบรถ"
            className="bg-destructive flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <Trash2 className="text-surface h-5 w-5" />
          </button>
        )}
      </div>
      <div className="bg-surface shadow-primary flex flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-4 pb-24">
        {isLoading ? (
          <PageSpinner />
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center gap-2 px-5">
              <div className="bg-primary flex h-[45px] w-[45px] items-center justify-center rounded-full">
                <BrandIcons brand={vehicle?.vehicleModel.brand} />
              </div>
              <div className="flex flex-col">
                <p className="text-primary text-[22px] leading-tight font-semibold md:text-2xl">
                  {vehicle?.licensePlate?.plateNumber &&
                  vehicle?.licensePlate?.province
                    ? `${formatPlate(vehicle.licensePlate.plateNumber)} ${vehicle.licensePlate.province}`
                    : "ไม่ระบุทะเบียนรถ"}
                </p>
                <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                  {getVehicleSubtitle(vehicle)}
                </p>
              </div>
            </div>
            <div className="mb-4 flex gap-2 px-5">
              <button
                type="button"
                onClick={() => startNewBill("/inspections/suspension")}
                className="font-athiti text-primary border-primary bg-surface flex h-11 flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold md:text-xl"
              >
                เช็กช่วงล่าง
              </button>
              <button
                type="button"
                onClick={() => startNewBill("/repairs/new")}
                className="font-athiti text-primary border-primary bg-surface flex h-11 flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold md:text-xl"
              >
                งานซ่อมใหม่
              </button>
            </div>
            <div className="mb-4 flex flex-1 flex-col px-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-normal text-[22px] font-semibold md:text-2xl">
                  ประวัติการซ่อม
                </p>
              </div>
              {!vehicle.repairs?.length ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                    ไม่มีประวัติการซ่อม
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicle.repairs.map((item) => (
                    <Link
                      key={item.id}
                      to={`/repairs/${item.id}`}
                      state={{ from: "vehicle-detail", vehicleId: id }}
                      className="block"
                    >
                      <RepairCard
                        icon={Wrench}
                        itemCount={countDisplayedItems(item.repairItems)}
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
            ? `${formatPlate(vehicle.licensePlate.plateNumber)} ${vehicle.licensePlate.province}`
            : "ไม่ระบุทะเบียนรถ"
        }
        itemDetail={getDisplayBrand(vehicle?.vehicleModel)}
      />
    </div>
  );
};

export default VehicleDetail;
