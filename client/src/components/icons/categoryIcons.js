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
} from "@/components/icons/Icons";

export const ICON_MAP = {
  บริการ: ToolBox,
  ช่วงล่าง: Suspension,
  ยาง: Tire,
  ยางใน: Innertube,
  น้ำมันเครื่อง: Oil,
  เบรค: Brake,
  โช๊คอัพ: Shock,
  "คลัช-เกียร์": Gear,
  แบตเตอรี่: Battery,
  ระบบไฟฟ้า: Light,
  สายพาน: Belt,
  ใบปัดน้ำฝน: Wiper,
  ไส้กรอง: Filter,
};

export const DEFAULT_ICON = ToolBox;
