import api from "@/lib/api";

export const getVehicles = async (search) => {
  return await api.get("/api/vehicles", {
    params: { search },
  });
};

export const getVehicleById = async (id) => {
  return await api.get(`/api/vehicle/${id}`);
};
