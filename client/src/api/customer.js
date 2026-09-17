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
