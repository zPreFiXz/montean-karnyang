import api from "@/lib/api";

export const uploadImage = async (form) => {
  return await api.post("/api/images", { image: form });
};

export const deleteImage = async (public_id) => {
  return await api.post("/api/deleteImage", { public_id });
};
