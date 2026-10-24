import { Label } from "@radix-ui/react-label";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash, X } from "lucide-react";
import ComboBox from "@/components/ui/ComboBox";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import { listVehicleModels } from "@/api/vehicleModel";
import { toastError } from "@/utils/handleError";
import { withOtherBrandLast } from "@/utils/vehicleBrand";

const VehicleCompatibilityInput = ({ setValue, initialData = null }) => {
  const [vehicles, setVehicles] = useState([{ brand: "", model: "" }]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const vehicleRefs = useRef([]);
  const [leavingIndex, setLeavingIndex] = useState(null);

  useEffect(() => {
    fetchVehicleModels();
  }, []);

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && !isInitialized) {
      setVehicles(initialData);
      setValue("compatibleVehicles", initialData);
      setIsInitialized(true);
    } else if (initialData === null && !isInitialized) {
      setVehicles([{ brand: "", model: "" }]);
      setValue("compatibleVehicles", null);
      setIsInitialized(true);
    }
  }, [setValue, initialData, isInitialized]);

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setVehicles(initialData);
      setValue("compatibleVehicles", initialData);
    } else if (initialData === null) {
      setVehicles([{ brand: "", model: "" }]);
      setValue("compatibleVehicles", null);
    }
  }, [initialData, setValue]);

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

  const getAvailableModels = (brandName) => {
    if (!brandName || !vehicleModels.length) return [];

    const modelsForBrand = vehicleModels
      .filter((item) => item.brand === brandName)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  // เรียงตามลิสต์แม่ตอนบันทึกเท่านั้น ไม่งั้นการ์ดจะสลับที่ใต้มือระหว่างกรอก
  const masterRank = (vehicle) => {
    const index = vehicleModels.findIndex(
      (item) => item.brand === vehicle.brand && item.model === vehicle.model,
    );
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  const updateFormValue = (vehicleList) => {
    const validVehicles = vehicleList
      .filter((v) => v.brand.trim() && v.model.trim())
      .map((v) => ({ brand: v.brand.trim(), model: v.model.trim() }))
      .sort((a, b) => masterRank(a) - masterRank(b));

    setValue(
      "compatibleVehicles",
      validVehicles.length > 0 ? validVehicles : null,
    );
  };

  const handleAddVehicle = () => {
    const newVehicles = [...vehicles, { brand: "", model: "" }];
    setVehicles(newVehicles);
    scrollToNewRow(() => vehicleRefs.current[newVehicles.length - 1]);
  };

  const handleClearVehicle = (index) => {
    const newVehicles = vehicles.map((vehicle, i) =>
      i === index ? { brand: "", model: "" } : vehicle,
    );
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length <= 1) return;

    const newVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
    setLeavingIndex(null);
  };

  const handleUpdateVehicle = (index, field, value) => {
    const newVehicles = vehicles.map((vehicle, i) => {
      if (i === index) {
        if (field === "brand") {
          return { brand: value, model: "" };
        } else {
          return { ...vehicle, [field]: value };
        }
      }
      return vehicle;
    });
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  return (
    <div className="space-y-4 px-5 pt-4">
      <Label className="text-subtle-dark text-xl font-medium">
        รุ่นรถที่ใส่ได้
      </Label>

      {vehicles.map((vehicle, index) => (
        <CollapsibleRow
          key={index}
          leaving={leavingIndex === index}
          onLeaveEnd={() => handleRemoveVehicle(index)}
        >
          <div
            ref={(el) => (vehicleRefs.current[index] = el)}
            className="mt-2 rounded-lg border p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-subtle-dark text-xl font-medium md:text-[22px]">
                รถคันที่ {index + 1}
              </p>

              <div className="flex">
                {vehicles.length === 1 && (vehicle.brand || vehicle.model) && (
                  <button
                    type="button"
                    onClick={() => handleClearVehicle(index)}
                    className="text-destructive flex cursor-pointer items-center text-lg font-medium md:text-xl"
                  >
                    <X className="mr-1 h-4 w-4" />
                    ล้างข้อมูล
                  </button>
                )}

                {vehicles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLeavingIndex(index)}
                    className="text-destructive flex cursor-pointer items-center text-lg font-medium md:text-xl"
                  >
                    <Trash className="mr-1 h-4 w-4" />
                    ลบ
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <ComboBox
                  label="ยี่ห้อรถ"
                  color="text-subtle-dark"
                  options={brands}
                  value={vehicle.brand}
                  onChange={(value) =>
                    handleUpdateVehicle(index, "brand", value)
                  }
                  placeholder="-- เลือกยี่ห้อ --"
                  name="brand"
                  customClass="text-lg md:text-xl"
                />
              </div>

              <div>
                <ComboBox
                  label="รุ่นรถ"
                  color="text-subtle-dark"
                  options={getAvailableModels(vehicle.brand)}
                  value={vehicle.model}
                  onChange={(value) =>
                    handleUpdateVehicle(index, "model", value)
                  }
                  placeholder="-- เลือกรุ่น --"
                  name="model"
                  disabled={!vehicle.brand}
                  customClass="text-lg md:text-xl"
                />
              </div>
            </div>
          </div>
        </CollapsibleRow>
      ))}

      <button
        type="button"
        onClick={handleAddVehicle}
        className="text-subtle-light mb-4 flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-gray-300 text-lg font-medium transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 md:text-xl"
      >
        <Plus className="h-5 w-5" />
        เพิ่มรถรุ่นอื่น
      </button>
    </div>
  );
};

export default VehicleCompatibilityInput;
