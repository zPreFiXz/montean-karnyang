import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "../layouts/Layout";
import Login from "@/pages/auth/Login";
import Dashboard from "../pages/Dashboard";
import VehicleBrandModel from "@/pages/admin/VehicleBrandModel";
import SuspensionInspection from "@/pages/inspections/SuspensionInspection";
import RepairCreate from "@/pages/repairs/RepairCreate";
import RepairSummary from "@/pages/repairs/RepairSummary";
import RepairStatus from "@/pages/repairs/RepairStatus";
import RepairDetail from "@/pages/repairs/RepairDetail";
import Inventory from "@/pages/inventory/Inventory";
import InventoryCreate from "@/pages/inventory/InventoryCreate";
import InventoryEdit from "@/pages/inventory/InventoryEdit";
import Vehicles from "@/pages/vehicles/Vehicles";
import VehicleDetail from "@/pages/vehicles/VehicleDetail";
import Employees from "@/pages/admin/Employees";
import SalesReport from "@/pages/reports/SalesReport";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteGuest from "./ProtectRouteGuest";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="login" element={<ProtectRouteGuest element={<Login />} />} />

        {/* User Routes */}
        <Route element={<ProtectRouteUser element={<Layout />} />}>
          <Route path="dashboard" element={<Dashboard />} />

          {/* Vehicle Brand and Model Management */}
          <Route path="vehicles/brand-models" element={<VehicleBrandModel />} />

          {/* Inspection Routes */}
          <Route path="inspections/suspension" element={<SuspensionInspection />} />

          {/* Repair Routes */}
          <Route path="repairs/new" element={<RepairCreate />} />
          <Route path="repairs/summary" element={<RepairSummary />} />
          <Route path="repairs/status/:status" element={<RepairStatus />} />
          <Route path="repairs/:id" element={<RepairDetail />} />

          {/* Inventory Routes */}
          <Route path="inventories" element={<Inventory />} />
          <Route path="inventories/new" element={<InventoryCreate />} />
          <Route path="inventories/:id" element={<InventoryEdit />} />

          {/* Vehicle Routes */}
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectRouteAdmin element={<Layout />} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Employee Management */}
          <Route path="employees" element={<Employees />} />

          {/* Report Routes */}
          <Route path="reports/sales/:period" element={<SalesReport />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
