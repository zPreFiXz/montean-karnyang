// ข้อมูลบรรทัดในบิลหน้าตาเดียวกับที่เซิร์ฟเวอร์ส่งมา (GET /repairs/:id) ใช้ร่วมกันหลายเทสต์

const category = (name) => ({ name });

export const partLine = ({
  name,
  brand = "",
  categoryName = "ช่วงล่าง",
  unitPrice = 100,
  quantity = 1,
  side = null,
  itemName,
  attributes = null,
  id = 1,
  stockQuantity = 10,
} = {}) => ({
  itemName: itemName ?? [brand, name].filter(Boolean).join(" "),
  unitPrice,
  quantity,
  side,
  part: {
    id,
    name,
    brand,
    partNumber: `P-${id}`,
    unit: "ชิ้น",
    stockQuantity,
    attributes,
    category: category(categoryName),
  },
  service: null,
});

export const serviceLine = ({
  name,
  unitPrice = 200,
  quantity = 1,
  itemName,
  id = 900,
} = {}) => ({
  itemName: itemName ?? name,
  unitPrice,
  quantity,
  side: null,
  part: null,
  service: { id, name, unit: "", category: category("บริการ") },
});

export const repairWith = (items, extra = {}) => ({
  id: 1,
  status: "PAID",
  type: "GENERAL",
  receiptNo: "RE-6910-0001",
  createdAt: "2026-10-20T03:00:00.000Z",
  totalPrice: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  repairItems: items,
  ...extra,
});
