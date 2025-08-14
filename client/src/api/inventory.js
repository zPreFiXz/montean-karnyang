import api from "@/lib/api";

// ถ้า `category` หรือ `search` ถูกระบุ จะส่งเป็นพารามิเตอร์ไปยัง API
// ถ้าไม่ระบุ จะส่งพารามิเตอร์ว่างเปล่า
// ตัวอย่าง: getInventory("electronics", "laptop") จะส่ง { category: "electronics", search: "laptop" }
export const getInventory = async (category, search) => {
  const params = {};

  if (category) params.category = category;
  if (search) params.search = search;

  return await api.get("/api/inventory", { params });
};
