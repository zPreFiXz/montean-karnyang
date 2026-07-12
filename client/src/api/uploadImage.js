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

export const deleteImage = async (token, public_id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/images`, {
    data: { public_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
