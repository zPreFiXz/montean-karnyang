import { useEffect } from "react";

// ตัวโหลดของแต่ละหน้า อยู่ที่เดียวเพื่อให้เส้นทางกับการเตรียมโค้ดล่วงหน้าใช้ตัวเดียวกัน
// ถ้าต่างคนต่างเขียน import() เอง เบราว์เซอร์จะมองเป็นคนละก้อนแล้วโหลดซ้ำ
export const pageImports = {
  Login: () => import("@/pages/auth/Login"),
  Dashboard: () => import("@/pages/Dashboard"),
  VehicleModelList: () => import("@/pages/admin/VehicleModelList"),
  SuspensionInspection: () =>
    import("@/pages/inspections/SuspensionInspection"),
  RepairCreate: () => import("@/pages/repairs/RepairCreate"),
  RepairReview: () => import("@/pages/repairs/RepairReview"),
  RepairList: () => import("@/pages/repairs/RepairList"),
  RepairDetail: () => import("@/pages/repairs/RepairDetail"),
  InventoryList: () => import("@/pages/inventory/InventoryList"),
  InventoryCreate: () => import("@/pages/inventory/InventoryCreate"),
  InventoryEdit: () => import("@/pages/inventory/InventoryEdit"),
  InventoryUsage: () => import("@/pages/inventory/InventoryUsage"),
  VehicleList: () => import("@/pages/vehicles/VehicleList"),
  VehicleDetail: () => import("@/pages/vehicles/VehicleDetail"),
  UserList: () => import("@/pages/admin/UserList"),
  EmployeeList: () => import("@/pages/admin/EmployeeList"),
  SalesReport: () => import("@/pages/reports/SalesReport"),
  AttendanceReport: () => import("@/pages/reports/AttendanceReport"),
  NotFound: () => import("@/pages/NotFound"),
};

// เตรียมโค้ดของหน้าที่มีโอกาสไปต่อไว้เงียบๆ ตั้งแต่ยังไม่กด
// กดจริงแล้วจะสลับหน้าทันที ไม่ต้องรอโหลดก้อนของหน้านั้นก่อน
export const prefetchPages = (names) => {
  for (const name of names) {
    // โหลดพลาด (เน็ตหลุด) ไม่ต้องทำอะไร ตอนกดจริงจะลองใหม่เองอยู่แล้ว
    pageImports[name]?.().catch(() => {});
  }
};

// รอให้หน้าปัจจุบันทำงานเสร็จก่อนค่อยโหลดของหน้าถัดไป จะได้ไม่แย่งจังหวะกัน
export const usePrefetchPages = (names) => {
  useEffect(() => {
    const idle = window.requestIdleCallback;
    const start = () => prefetchPages(names);
    const id = idle ? idle(start, { timeout: 2000 }) : setTimeout(start, 300);

    return () => {
      if (idle && window.cancelIdleCallback) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
