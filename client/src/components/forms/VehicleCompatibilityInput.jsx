import { Label } from "@radix-ui/react-label";
import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Trash } from "lucide-react";

const VehicleCompatibilityInput = ({ setValue }) => {
  const [vehicles, setVehicles] = useState([{ brand: "", model: "" }]);

  useEffect(() => {
    setValue("compatibleVehicles", null);
  }, [setValue]);

  const updateFormValue = (vehicleList) => {
    const validVehicles = vehicleList
      .filter((v) => v.brand.trim() && v.model.trim())
      .map((v) => ({ brand: v.brand.trim(), model: v.model.trim() }));

    setValue(
      "compatibleVehicles",
      validVehicles.length > 0 ? validVehicles : null
    );
  };

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { brand: "", model: "" }]);
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length <= 1) return;
    const newVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  const handleUpdateVehicle = (index, field, value) => {
    const newVehicles = vehicles.map((vehicle, i) =>
      i === index ? { ...vehicle, [field]: value } : vehicle
    );
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  return (
    <div className="px-[20px] pt-[16px] space-y-[16px]">
      <Label className="font-medium text-[18px] text-subtle-dark">
        รถที่เข้ากันได้
      </Label>
      {vehicles.map((vehicle, index) => (
        <div key={index} className="p-[16px] mt-[8px] rounded-[10px] border">
          <div className="flex justify-between items-center mb-[8px]">
            <span className="font-medium text-[16px] text-subtle-dark">
              รถคันที่ {index + 1}
            </span>
            {vehicles.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveVehicle(index)}
                className="flex items-center font-medium text-[16px] text-red-500 hover:text-red-600 transition-all cursor-pointer"
              >
                <Trash className="w-4 h-4 mr-[4px]" />
                ลบ
              </button>
            )}
          </div>
          <div>
            <div>
              <Label className="block text-[14px] font-medium text-subtle-dark mb-[4px]">
                ยี่ห้อ
              </Label>
              <Input
                type="text"
                value={vehicle.brand}
                onChange={(e) =>
                  handleUpdateVehicle(index, "brand", e.target.value)
                }
                placeholder="เช่น Toyota, Isuzu, Honda"
                className="w-full mb-[8px] text-[16px] rounded-[20px]"
                style={{
                  "--tw-ring-color": "#5b46f4",
                  "--tw-border-opacity": "1",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#5b46f4";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "";
                  e.target.style.borderWidth = "";
                  e.target.style.boxShadow = "";
                }}
              />
            </div>

            <div>
              <Label className="block text-[14px] font-medium text-subtle-dark mb-[4px]">
                รุ่น
              </Label>
              <Input
                type="text"
                value={vehicle.model}
                onChange={(e) =>
                  handleUpdateVehicle(index, "model", e.target.value)
                }
                placeholder="เช่น Hilux Revo, D-Max, City"
                className="w-full mb-[8px] text-[16px] rounded-[20px]"
                style={{
                  "--tw-ring-color": "#5b46f4",
                  "--tw-border-opacity": "1",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#5b46f4";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "";
                  e.target.style.borderWidth = "";
                  e.target.style.boxShadow = "";
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddVehicle}
        className="w-full py-2 font-medium transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer text-subtle-light hover:border-primary hover:text-primary"
      >
        + เพิ่มรถรุ่นอื่น
      </button>
    </div>
  );
};

export default VehicleCompatibilityInput;
