import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "@/layouts/Layout";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import VehicleModelList from "@/pages/admin/VehicleModelList";
import SuspensionInspection from "@/pages/inspections/SuspensionInspection";
import RepairCreate from "@/pages/repairs/RepairCreate";
import RepairReview from "@/pages/repairs/RepairReview";
import RepairList from "@/pages/repairs/RepairList";
import RepairDetail from "@/pages/repairs/RepairDetail";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryCreate from "@/pages/inventory/InventoryCreate";
import InventoryEdit from "@/pages/inventory/InventoryEdit";
import VehicleList from "@/pages/vehicles/VehicleList";
import VehicleDetail from "@/pages/vehicles/VehicleDetail";
import UserList from "@/pages/admin/UserList";
import EmployeeList from "@/pages/admin/EmployeeList";
import SalesReport from "@/pages/reports/SalesReport";
import AttendanceReport from "@/pages/reports/AttendanceReport";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteGuest from "./ProtectRouteGuest";

const AppRoutes = () => {
  return (
    <BrowserRouter>
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
          <Route
            path="reports/attendance"
            element={<AttendanceReport />}
          />
        </Route>

        {/* Not Found */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
