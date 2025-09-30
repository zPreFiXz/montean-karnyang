import { Link, useSearchParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import SearchBar from "@/components/forms/SearchBar";
import { LoaderCircle } from "lucide-react";
import { getVehicles } from "@/api/vehicle";
import CarCard from "@/components/cards/CarCard";
import { Car, Document } from "@/components/icons/Icon";
import { scrollMainToTop } from "@/lib/utils";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);

  const search = searchParams.get("search");

  useEffect(() => {
    scrollMainToTop();

    if (isInitializing.current) return;
    isInitializing.current = true;

    const params = new URLSearchParams();
    setSearchParams(params);
    handleFilter(null);

    setTimeout(() => {
      isInitializing.current = false;
    }, 200);
  }, []);

  useEffect(() => {
    if (isInitializing.current) return;

    if (search) {
      handleFilter(search);
    } else {
      handleFilter(null);
    }
  }, [search]);

  const handleFilter = async (search) => {
    try {
      const res = await getVehicles(search);
      setVehicles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[87px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-surface/20">
          <Document color="#ffffff" />
        </div>
        <div>
          <p className="font-semibold text-[24px] md:text-[26px] text-surface">
            ประวัติลูกค้า
          </p>
        </div>
      </div>

      <div className="w-full min-h-[calc(100vh-65px)] pb-[112px] xl:pb-[16px] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[16px]">
          {/* แถบค้นหา */}
          <SearchBar placeholder="ค้นหาทะเบียน, จังหวัด, ยี่ห้อ, รุ่นรถ" />

          {/* รายการรถ */}
          {isLoading ? (
            <div className="flex justify-center items-center h-[490px]">
              <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex justify-center items-center h-[490px]">
              <p className="font-medium text-[20px] md:text-[22px] text-subtle-light">
                ไม่พบลูกค้า
              </p>
            </div>
          ) : (
            vehicles.map((item, index) => (
              <div key={index} className="mt-[16px]">
                <Link to={`/vehicle/${item.id}`}>
                  <CarCard
                    bg="primary"
                    color="#1976d2"
                    icon={Car}
                    licensePlate={
                      item.licensePlate
                        ? `${item.licensePlate.plateNumber} ${item.licensePlate.province}`
                        : "ไม่ระบุทะเบียนรถ"
                    }
                    brand={`${item.vehicleBrandModel.brand} ${item.vehicleBrandModel.model}`}
                  />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default Vehicles;
