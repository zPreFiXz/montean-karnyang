import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "@/layouts/Layout";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import VehicleBrandList from "@/pages/admin/VehicleBrandList";
import SuspensionInspection from "@/pages/inspections/SuspensionInspection";
import RepairCreate from "@/pages/repairs/RepairCreate";
import RepairSummary from "@/pages/repairs/RepairSummary";
import RepairStatus from "@/pages/repairs/RepairStatus";
import RepairDetail from "@/pages/repairs/RepairDetail";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryCreate from "@/pages/inventory/InventoryCreate";
import InventoryEdit from "@/pages/inventory/InventoryEdit";
import VehicleList from "@/pages/vehicles/VehicleList";
import VehicleDetail from "@/pages/vehicles/VehicleDetail";
import EmployeeList from "@/pages/admin/EmployeeList";
import SalesReport from "@/pages/reports/SalesReport";
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
          <Route path="repairs" element={<RepairStatus />} />
          <Route path="repairs/new" element={<RepairCreate />} />
          <Route path="repairs/:id" element={<RepairDetail />} />
          <Route path="repairs/summary" element={<RepairSummary />} />

          {/* Inventory */}
          <Route path="inventory" element={<InventoryList />} />
          <Route path="inventory/new" element={<InventoryCreate />} />
          <Route path="inventory/:id" element={<InventoryEdit />} />

          {/* Vehicle */}
          <Route path="vehicles" element={<VehicleList />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="vehicles/brands" element={<VehicleBrandList />} />
        </Route>

        {/* Private Admin */}
        <Route
          path="admin"
          element={<ProtectRouteAdmin element={<Layout />} />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="reports/sales" element={<SalesReport />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
