import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (
    ["post", "put", "patch", "delete"].includes(config.method) &&
    !config.headers["X-CSRF-TOKEN"]
  ) {
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/csrf-token`,
      {
        withCredentials: true,
      }
    );
    config.headers["X-CSRF-TOKEN"] = data.csrfToken;
  }
  return config;
});

export default api;
