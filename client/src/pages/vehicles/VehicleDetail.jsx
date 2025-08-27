import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, LoaderCircle, Wrench } from "lucide-react";
import { Car } from "@/components/icons/Icon";
import { getVehicleById } from "@/api/vehicle";
import { formatDate, formatTime } from "@/lib/utils";
import RepairCard from "@/components/cards/RepairCard";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchVehicleDetail();
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

  return (
    <div className="w-full h-[78px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] py-[16px]">
        <button onClick={() => navigate(-1)} className="mt-[2px] text-surface">
          <ChevronLeft />
        </button>
        <p className="font-semibold text-[22px] text-surface">ประวัติลูกค้า</p>
      </div>

      <div className="min-h-[calc(100vh-65px)] pt-[16px] pb-[88px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        {isLoading ? (
          <div className="flex justify-center items-center h-[530px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-[8px] px-[20px] mb-[16px]">
              <div className="flex justify-center items-center w-[45px] h-[45px] rounded-full bg-primary">
                <Car color="#5b46f4" />
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-[22px] text-primary leading-tight">
                  {vehicle?.licensePlate
                    ? `${vehicle.licensePlate.plateNumber} ${vehicle.licensePlate.province}`
                    : "ไม่มีทะเบียน"}
                </p>
                <p className="font-medium text-[18px] text-subtle-dark leading-tight">
                  {vehicle?.brand} {vehicle?.model}
                </p>
              </div>
            </div>

            {vehicle.repairs && (
              <div className="px-[20px] mb-[16px]">
                <div className="flex justify-between items-center mb-[16px]">
                  <p className="font-semibold text-[22px] text-normal">
                    ประวัติการซ่อม
                  </p>
                </div>
                <div className="space-y-[16px]">
                  {vehicle.repairs.map((item, index) => (
                    <div key={index} className="flex flex-col gap-[8px]">
                      <p className="font-medium text-[18px] text-subtle-dark">
                        {formatDate(item.createdAt)} |{" "}
                        {formatTime(item.createdAt)} น.
                      </p>
                      <Link to={`/repair/${item.id}`}>
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
