import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, LoaderCircle, Wrench } from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import { getVehicle } from "@/api/vehicle";
import { formatDate, formatTime } from "@/utils/formats";
import RepairCard from "@/components/cards/RepairCard";
import { toastError } from "@/utils/handleError";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleDetail();
  }, [id]);

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
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] px-[20px] py-[18px]">
        <button
          onClick={() => navigate("/vehicles")}
          className="text-surface mt-[2px] cursor-pointer"
        >
          <ChevronLeft />
        </button>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          ประวัติลูกค้า
        </p>
      </div>
      <div className="bg-surface shadow-primary min-h-[calc(100vh-65px)] rounded-tl-2xl rounded-tr-2xl pt-[16px] pb-[96px]">
        {isLoading ? (
          <div className="flex h-[530px] items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div>
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
                  {vehicle?.vehicleModel.brand} {vehicle?.vehicleModel.model}
                </p>
              </div>
            </div>
            {vehicle.repairs && (
              <div className="mb-[16px] px-[20px]">
                <div className="mb-[8px] flex items-center justify-between">
                  <p className="text-normal text-[22px] font-semibold md:text-2xl">
                    ประวัติการซ่อม
                  </p>
                </div>
                <div className="space-y-[16px]">
                  {vehicle.repairs.map((item, index) => (
                    <div key={index} className="flex flex-col gap-[8px]">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        {formatDate(item.createdAt)} |{" "}
                        {formatTime(item.createdAt)} น.
                      </p>
                      <Link
                        to={`/repairs/${item.id}`}
                        state={{ from: "vehicle-detail", vehicleId: id }}
                      >
                        <RepairCard
                          icon={Wrench}
                          repairId={item.id}
                          itemCount={item.repairItems?.length}
                        />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetail;
