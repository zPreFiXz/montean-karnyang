import apiClient from "./apiClient";

export const uploadImage = async (imageBase64) => {
  return await apiClient.post("/images", { image: imageBase64 });
};

export const deleteImage = async (publicId) => {
  return await apiClient.delete("/images", { data: { publicId } });
};
