import apiClient from "@/api/apiClient";

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

// เลขใบวางบิลที่จะได้ถ้าพิมพ์ตอนนี้ (ชุดบิลเดิมได้เลขเดิม) ไว้แสดงในหน้าตัวอย่าง
export const peekOrganizationBillNo = async (id, month) => {
  return await apiClient.get(`/customers/organizations/${id}/billing-no`, {
    params: month ? { month } : {},
  });
};

// พิมพ์ใบวางบิล: ใบสรุปยอดค้างหนึ่งแผ่น ตามด้วยใบเสร็จของแต่ละบิล
// ส่ง month (เช่น 2026-09) มาเมื่อพิมพ์ของเดือนนั้น ไม่ส่ง = บิลที่ยังค้างชำระทั้งหมด
export const printOrganizationBill = async (id, month) => {
  return await apiClient.post(`/customers/organizations/${id}/print`, {
    ...(month ? { month } : {}),
  });
};

export const listCustomerDirectory = async () => {
  return await apiClient.get("/customers/directory");
};

export const getCustomer = async (id) => {
  return await apiClient.get(`/customers/${id}`);
};

// อะไหล่ที่ร้านเราไปรับจากร้านค้า (เฉพาะลูกค้าประเภทร้านค้า) ไว้หักกลบตอนวางบิล
// data = { takenAt, items } บันทึกทั้งชุดในคราวเดียว
export const createShopPurchases = async (shopId, data) => {
  return await apiClient.post(
    `/customers/organizations/${shopId}/purchases`,
    data,
  );
};

export const updateShopPurchase = async (shopId, purchaseId, data) => {
  return await apiClient.put(
    `/customers/organizations/${shopId}/purchases/${purchaseId}`,
    data,
  );
};

export const deleteShopPurchase = async (shopId, purchaseId) => {
  return await apiClient.delete(
    `/customers/organizations/${shopId}/purchases/${purchaseId}`,
  );
};

// ids = รายการที่เห็นอยู่บนจอ รายการที่เพิ่งเพิ่มระหว่างนั้นจะไม่ถูกปิดไปด้วย
export const settleShopPurchases = async (shopId, ids) => {
  return await apiClient.post(
    `/customers/organizations/${shopId}/purchases/settle`,
    { ids },
  );
};
