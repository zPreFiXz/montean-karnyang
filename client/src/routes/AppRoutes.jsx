import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "@/layouts/Layout";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import VehicleBrandModels from "@/pages/admin/VehicleBrandModels";
import SuspensionInspection from "@/pages/inspections/SuspensionInspection";
import CreateRepair from "@/pages/repairs/CreateRepair";
import RepairSummary from "@/pages/repairs/RepairSummary";
import RepairStatus from "@/pages/repairs/RepairStatus";
import RepairDetail from "@/pages/repairs/RepairDetail";
import Inventory from "@/pages/inventory/Inventory";
import CreateInventory from "@/pages/inventory/CreateInventory";
import EditInventory from "@/pages/inventory/EditInventory";
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
          <Route path="repairs/new" element={<CreateRepair />} />
          <Route path="repairs/summary" element={<RepairSummary />} />
          <Route path="repairs/:id" element={<RepairDetail />} />

          {/* Inventory */}
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/new" element={<CreateInventory />} />
          <Route path="inventory/:id" element={<EditInventory />} />

          {/* Vehicle */}
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route
            path="vehicles/brand-models"
            element={<VehicleBrandModels />}
          />
        </Route>

        {/* Private Admin */}
        <Route
          path="admin"
          element={<ProtectRouteAdmin element={<Layout />} />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports/sales" element={<SalesReport />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
