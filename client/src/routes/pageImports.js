import { useEffect } from "react";

// ที่เดียวทั้งเส้นทางและการเตรียมโค้ด ต่างคนต่าง import() เบราว์เซอร์จะโหลดซ้ำ
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
  InventoryForm: () => import("@/pages/inventory/InventoryForm"),
  InventoryUsage: () => import("@/pages/inventory/InventoryUsage"),
  OrganizationList: () => import("@/pages/organizations/OrganizationList"),
  OrganizationDetail: () => import("@/pages/organizations/OrganizationDetail"),
  OrganizationHistory: () =>
    import("@/pages/organizations/OrganizationHistory"),
  VehicleList: () => import("@/pages/vehicles/VehicleList"),
  VehicleDetail: () => import("@/pages/vehicles/VehicleDetail"),
  UserList: () => import("@/pages/admin/UserList"),
  EmployeeList: () => import("@/pages/admin/EmployeeList"),
  SalesReport: () => import("@/pages/reports/SalesReport"),
  TopItemsReport: () => import("@/pages/reports/TopItemsReport"),
  AttendanceReport: () => import("@/pages/reports/AttendanceReport"),
  NotFound: () => import("@/pages/NotFound"),
};

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
