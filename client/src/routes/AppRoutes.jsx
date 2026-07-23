import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "@/layouts/Layout";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteGuest from "./ProtectRouteGuest";

// แยกแต่ละหน้าเป็น chunk ของตัวเอง โหลดเมื่อเข้าเส้นทางนั้นจริง (ลดขนาด bundle แรก)
const Login = lazy(() => import("@/pages/auth/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const VehicleModelList = lazy(() => import("@/pages/admin/VehicleModelList"));
const SuspensionInspection = lazy(() => import("@/pages/inspections/SuspensionInspection"));
const RepairCreate = lazy(() => import("@/pages/repairs/RepairCreate"));
const RepairReview = lazy(() => import("@/pages/repairs/RepairReview"));
const RepairList = lazy(() => import("@/pages/repairs/RepairList"));
const RepairDetail = lazy(() => import("@/pages/repairs/RepairDetail"));
const InventoryList = lazy(() => import("@/pages/inventory/InventoryList"));
const InventoryCreate = lazy(() => import("@/pages/inventory/InventoryCreate"));
const InventoryEdit = lazy(() => import("@/pages/inventory/InventoryEdit"));
const VehicleList = lazy(() => import("@/pages/vehicles/VehicleList"));
const VehicleDetail = lazy(() => import("@/pages/vehicles/VehicleDetail"));
const UserList = lazy(() => import("@/pages/admin/UserList"));
const EmployeeList = lazy(() => import("@/pages/admin/EmployeeList"));
const SalesReport = lazy(() => import("@/pages/reports/SalesReport"));
const AttendanceReport = lazy(() => import("@/pages/reports/AttendanceReport"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="border-primary h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" />
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="login"
            element={<ProtectRouteGuest element={<Login />} />}
          />

          {/* Private User */}
          <Route element={<ProtectRouteUser element={<Layout />} />}>
            <Route path="dashboard" element={<Dashboard />} />

            {/* Inspection */}
            <Route
              path="inspections/suspension"
              element={<SuspensionInspection />}
            />

            {/* Repair */}
            <Route path="repairs" element={<RepairList />} />
            <Route path="repairs/new" element={<RepairCreate />} />
            <Route path="repairs/review" element={<RepairReview />} />
            <Route path="repairs/:id" element={<RepairDetail />} />

            {/* Inventory */}
            <Route path="inventory" element={<InventoryList />} />
            <Route path="inventory/new" element={<InventoryCreate />} />
            <Route path="inventory/:id" element={<InventoryEdit />} />

            {/* Vehicle */}
            <Route path="vehicles" element={<VehicleList />} />
            <Route path="vehicles/models" element={<VehicleModelList />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
          </Route>

          {/* Private Admin */}
          <Route
            path="admin"
            element={<ProtectRouteAdmin element={<Layout />} />}
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserList />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="reports/sales" element={<SalesReport />} />
            <Route path="reports/attendance" element={<AttendanceReport />} />
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
export default AppRoutes;
