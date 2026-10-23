import { useEffect, useState } from "react";
import { listVehicleModels } from "@/api/vehicleModel";
import { toastError } from "@/utils/handleError";
import { withOtherBrandLast } from "@/utils/vehicleBrand";

// ยี่ห้อกับรุ่นรถสำหรับช่องเลือกในหน้าเปิดบิล โหลดครั้งเดียวตอนเปิดหน้า
const useVehicleModels = () => {
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);

  const fetchVehicleModels = async () => {
    try {
      const res = await listVehicleModels();
      setVehicleModels(res.data);

      const uniqueBrands = withOtherBrandLast([
        ...new Set(res.data.map((item) => item.brand)),
      ]);
      setBrands(uniqueBrands.map((brand) => ({ id: brand, name: brand })));
    } catch (error) {
      toastError(error);
    }
  };

  useEffect(() => {
    fetchVehicleModels();
  }, []);

  const modelsForBrand = (brand) =>
    vehicleModels
      .filter((item) => item.brand === brand)
      .map((item) => ({ id: item.model, name: item.model }));

  return { brands, modelsForBrand };
};

export default useVehicleModels;
