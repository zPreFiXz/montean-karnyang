import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, LoaderCircle, Wrench } from "lucide-react";
import { Car } from "@/components/icons/Icon";
import { getVehicleById } from "@/api/vehicle";
import { formatDate, formatTime, scrollMainToTop } from "@/lib/utils";
import RepairCard from "@/components/cards/RepairCard";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    scrollMainToTop();
    fetchVehicleDetail();
  }, [id]);

  const fetchVehicleDetail = async () => {
    try {
      const res = await getVehicleById(id);
      setVehicle(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[87px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] py-[18px]">
        <button
          onClick={() => navigate("/vehicles")}
          className="mt-[2px] text-surface cursor-pointer"
        >
          <ChevronLeft />
        </button>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          ประวัติลูกค้า
        </p>
      </div>

      <div className="min-h-[calc(100vh-65px)] pt-[16px] pb-[96px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        {isLoading ? (
          <div className="flex justify-center items-center h-[530px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-[8px] px-[20px] mb-[16px]">
              <div className="flex justify-center items-center w-[45px] h-[45px] rounded-full bg-primary">
                <Car color="#1976d2" />
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-[22px] md:text-[24px] text-primary leading-tight">
                  {vehicle?.licensePlate?.plateNumber &&
                  vehicle?.licensePlate?.province
                    ? `${vehicle.licensePlate.plateNumber} ${vehicle.licensePlate.province}`
                    : "ไม่ระบุทะเบียนรถ"}
                </p>
                <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark leading-tight">
                  {vehicle?.vehicleBrandModel.brand}{" "}
                  {vehicle?.vehicleBrandModel.model}
                </p>
              </div>
            </div>

            {vehicle.repairs && (
              <div className="px-[20px] mb-[16px]">
                <div className="flex justify-between items-center mb-[8px]">
                  <p className="font-semibold text-[22px] md:text-[24px] text-normal">
                    ประวัติการซ่อม
                  </p>
                </div>
                <div className="space-y-[16px]">
                  {vehicle.repairs.map((item, index) => (
                    <div key={index} className="flex flex-col gap-[8px]">
                      <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                        {formatDate(item.createdAt)} |{" "}
                        {formatTime(item.createdAt)} น.
                      </p>
                      <Link
                        to={`/repair/${item.id}`}
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
