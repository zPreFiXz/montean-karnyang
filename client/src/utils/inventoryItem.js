import { formatQuantity } from "@/utils/formats";
import { tracksStock } from "@/utils/stock";
import { dotOrderKey } from "@/utils/tireLot";

// รวมล็อต DOT เดียวกัน เรียงเก่าไปใหม่ (DOT 4 หลักคือ WWYY เช่น 0126 = สัปดาห์ 1 ปี 2026)
export const summarizeTireLots = (lots = []) => {
  const rows = new Map();
  for (const lot of lots || []) {
    const label = String(lot.dotCode ?? "").trim() || "ไม่ระบุ";
    const quantity = Number(lot.quantity) || 0;
    const current = rows.get(label);
    if (current) current.quantity += quantity;
    else rows.set(label, { label, quantity, sortKey: dotOrderKey(label) });
  }
  return [...rows.values()].sort((a, b) => a.sortKey - b.sortKey);
};

// คงลำดับเดิมที่บันทึกมา (เรียงตามลิสต์รุ่นรถแล้ว)
export const groupVehiclesByBrand = (vehicles = []) => {
  const groups = new Map();
  for (const vehicle of vehicles || []) {
    const brand = vehicle.brand || "ไม่ระบุ";
    if (!groups.has(brand)) groups.set(brand, []);
    groups.get(brand).push(vehicle.model);
  }
  return [...groups.entries()].map(([brand, models]) => ({ brand, models }));
};

// tone: out / low / ok / untracked — เกณฑ์ต้องตรงกับ InventoryCard และ Dashboard
// ต่ำ = น้อยกว่าขั้นต่ำ ไม่ใช่เท่ากับ เพราะขั้นต่ำคือจำนวนที่ต้องมีอยู่เสมอ
// ชุดน้ำมันไม่มีขั้นต่ำของตัวเอง บอกแค่ว่าเติมได้กี่ชุดหรือหมดแล้ว
export const stockStatusOf = (item, isOilKit) => {
  const quantity = Number(item.stockQuantity) || 0;
  const amount = `${formatQuantity(quantity)} ${item.unit || ""}`.trim();

  if (isOilKit) {
    return quantity === 0
      ? { tone: "out", label: "สต็อกหมด" }
      : { tone: "ok", label: `จำนวน ${amount}` };
  }
  if (!tracksStock(item.minStockLevel)) {
    return { tone: "untracked", label: `ไม่ได้ตั้งขั้นต่ำ | จำนวน ${amount}` };
  }
  if (quantity === 0) return { tone: "out", label: "สต็อกหมด" };
  if (quantity < Number(item.minStockLevel)) {
    return { tone: "low", label: `สต็อกต่ำ | จำนวน ${amount}` };
  }
  return { tone: "ok", label: `สต็อกปกติ | จำนวน ${amount}` };
};
