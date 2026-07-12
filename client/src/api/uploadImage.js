import axios from "axios";

export const uploadImage = async (token, form) => {
  return await axios.post(
    `${import.meta.env.VITE_API_URL}/api/images`,
    { image: form },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const deleteImage = async (token, publicId) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/images`, {
    data: { publicId },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
