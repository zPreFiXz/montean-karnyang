import { lazy, Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "@/layouts/Layout";
import { pageImports } from "./pageImports";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteGuest from "./ProtectRouteGuest";

// แยกแต่ละหน้าเป็น chunk ของตัวเอง โหลดเมื่อเข้าเส้นทางนั้นจริง (ลดขนาด bundle แรก)
const Login = lazy(pageImports.Login);
const Dashboard = lazy(pageImports.Dashboard);
const VehicleModelList = lazy(pageImports.VehicleModelList);
const SuspensionInspection = lazy(pageImports.SuspensionInspection);
const RepairCreate = lazy(pageImports.RepairCreate);
const RepairReview = lazy(pageImports.RepairReview);
const RepairList = lazy(pageImports.RepairList);
const RepairDetail = lazy(pageImports.RepairDetail);
const InventoryList = lazy(pageImports.InventoryList);
const InventoryCreate = lazy(pageImports.InventoryCreate);
const InventoryEdit = lazy(pageImports.InventoryEdit);
const InventoryUsage = lazy(pageImports.InventoryUsage);
const VehicleList = lazy(pageImports.VehicleList);
const VehicleDetail = lazy(pageImports.VehicleDetail);
const UserList = lazy(pageImports.UserList);
const EmployeeList = lazy(pageImports.EmployeeList);
const SalesReport = lazy(pageImports.SalesReport);
const AttendanceReport = lazy(pageImports.AttendanceReport);
const NotFound = lazy(pageImports.NotFound);

const RouteFallback = () => (
  <div className="flex min-h-svh items-center justify-center">
    <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ProtectRouteGuest element={<Login />} />
            </Suspense>
          }
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
          <Route
            path="inventory/:type/:id/usage"
            element={<InventoryUsage />}
          />
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
        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
