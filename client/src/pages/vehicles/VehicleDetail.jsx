import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, LoaderCircle, Wrench } from "lucide-react";
import BrandIcons from "@/components/icons/BrandIcons";
import { getVehicleById } from "@/api/vehicle";
import { formatDate, formatTime } from "@/utils/formats";
import RepairCard from "@/components/cards/RepairCard";

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
      const res = await getVehicleById(id);
      setVehicle(res.data);
    } catch (error) {
      console.log(error);
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
        <p className="text-surface text-[24px] font-semibold md:text-[26px]">
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
                <BrandIcons brand={vehicle?.vehicleBrand.brand} />
              </div>
              <div className="flex flex-col">
                <p className="text-primary text-[22px] leading-tight font-semibold md:text-[24px]">
                  {vehicle?.licensePlate?.plate &&
                  vehicle?.licensePlate?.province
                    ? `${vehicle.licensePlate.plate} ${vehicle.licensePlate.province}`
                    : "ไม่ระบุทะเบียนรถ"}
                </p>
                <p className="text-subtle-dark text-[18px] leading-tight font-medium md:text-[20px]">
                  {vehicle?.vehicleBrand.brand} {vehicle?.vehicleBrand.model}
                </p>
              </div>
            </div>
            {vehicle.repairs && (
              <div className="mb-[16px] px-[20px]">
                <div className="mb-[8px] flex items-center justify-between">
                  <p className="text-normal text-[22px] font-semibold md:text-[24px]">
                    ประวัติการซ่อม
                  </p>
                </div>
                <div className="space-y-[16px]">
                  {vehicle.repairs.map((item, index) => (
                    <div key={index} className="flex flex-col gap-[8px]">
                      <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
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
