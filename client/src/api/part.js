import api from "@/lib/api";

export const getParts = async (category, search) => {
  const params = {};

  if (category) params.category = category;
  if (search) params.search = search;

  return await api.get("/api/parts", { params });
};

export const createPart = async (data) => {
  return await api.post("/api/part", data);
};
