import api from "@/lib/api";

export const uploadImage = async (form) => {
  return await api.post("/api/image", { image: form });
};

export const deleteImage = async (public_id) => {
  return await api.post("/api/delete-image", { public_id });
};
