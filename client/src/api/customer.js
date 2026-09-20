import apiClient from "./apiClient";

export const listCustomers = async (search) => {
  return await apiClient.get("/customers", { params: { search } });
};

// ตั้งว่าลูกค้ารายนี้เป็นหน่วยงานราชการหรือร้านค้า ส่งค่าว่างคือกลับเป็นลูกค้าทั่วไป
export const setCustomerOrganizationType = async (id, organizationType) => {
  return await apiClient.patch(`/customers/${id}/organization-type`, {
    organizationType,
  });
};

export const listOrganizations = async (search) => {
  return await apiClient.get("/customers/organizations", {
    params: { search },
  });
};

// scope = "all" คือประวัติทั้งหมด ไม่ส่งมาคือเฉพาะบิลที่ยังค้างชำระ
export const listOrganizationRepairs = async (id, scope) => {
  return await apiClient.get(`/customers/organizations/${id}/repairs`, {
    params: { scope },
  });
};

// พิมพ์ใบวางบิล: ใบสรุปยอดค้างหนึ่งแผ่น ตามด้วยใบเสร็จของแต่ละบิล
// ส่ง month (เช่น 2026-09) มาเมื่อพิมพ์ของเดือนนั้น ไม่ส่ง = บิลที่ยังค้างชำระทั้งหมด
export const printOrganizationBill = async (id, month) => {
  return await apiClient.post(`/customers/organizations/${id}/print`, {
    ...(month ? { month } : {}),
  });
};
