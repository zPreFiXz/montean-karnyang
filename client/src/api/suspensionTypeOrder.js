import apiClient from "@/api/apiClient";

export const getSuspensionTypeOrder = async () => {
  return await apiClient.get("/suspension-type-order");
};

// group = "side" (ซ้ายกับขวาใช้ร่วมกัน) | "other"
export const updateSuspensionTypeOrder = async (group, types) => {
  return await apiClient.put("/suspension-type-order", { group, types });
};
