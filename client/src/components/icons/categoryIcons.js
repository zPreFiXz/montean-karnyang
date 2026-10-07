import {
  ToolBox,
  Tire,
  Innertube,
  Oil,
  Filter,
  Battery,
  Brake,
  Shock,
  Belt,
  Gear,
  Light,
  Wiper,
  Suspension,
  UsedTire,
  OilFilter,
  OtherParts,
} from "@/components/icons/Icons";

export const ICON_MAP = {
  บริการ: ToolBox,
  ช่วงล่าง: Suspension,
  ยาง: Tire,
  ยางเปอร์เซ็นต์: UsedTire,
  ยางใน: Innertube,
  น้ำมัน: Oil,
  กรอง: OilFilter,
  เบรก: Brake,
  โช๊คอัพ: Shock,
  ระบบส่งกำลัง: Gear,
  แบตเตอรี่: Battery,
  ระบบไฟฟ้า: Light,
  สายพาน: Belt,
  ใบปัดน้ำฝน: Wiper,
  ไส้กรอง: Filter,
  // อะไหล่จิปาถะที่ไม่เข้าหมวดไหน ใช้ไอคอนน็อตตัวเดียวกับการ์ดอะไหล่ที่ไม่มีรูป
  อื่นๆ: OtherParts,
};

export const DEFAULT_ICON = ToolBox;
