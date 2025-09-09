import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "../layouts/Layout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "../pages/Dashboard";
import SalesReport from "@/pages/reports/SalesReport";
import RepairStatus from "@/pages/repairs/RepairStatus";
import Suspension from "@/pages/inspections/Suspension";
import CreateRepair from "@/pages/repairs/CreateRepair";
import RepairSummary from "@/pages/repairs/RepairSummary";
import RepairDetail from "@/pages/repairs/RepairDetail";
import Inventory from "@/pages/inventory/Inventory";
import CreateItem from "@/pages/inventory/CreateItem";
import EditItem from "@/pages/inventory/EditItem";
import Vehicles from "@/pages/vehicles/Vehicles";
import VehicleDetail from "@/pages/vehicles/VehicleDetail";
import VehicleBrandManagement from "@/pages/admin/VehicleBrandManagement";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import SystemDataManagement from "@/pages/admin/SystemDataManagement";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteGuest from "./ProtectRouteGuest";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="login"
          element={<ProtectRouteGuest element={<Login />} />}
        />
        <Route
          path="register"
          element={<ProtectRouteGuest element={<Register />} />}
        />

        {/* User Routes */}
        <Route element={<ProtectRouteUser element={<Layout />} />}>
          <Route path="dashboard" element={<Dashboard />} />

          {/* Inspection Routes */}
          <Route path="inspections/suspension" element={<Suspension />} />

          {/* Report Routes */}
          <Route path="reports/sales/:period" element={<SalesReport />} />

          {/* Repair Routes */}
          <Route path="repair/new" element={<CreateRepair />} />
          <Route path="repair/summary" element={<RepairSummary />} />
          <Route path="repair/status/:status" element={<RepairStatus />} />
          <Route path="repair/:id" element={<RepairDetail />} />

          {/* Inventory Routes */}
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/new" element={<CreateItem />} />
          <Route path="inventory/:id" element={<EditItem />} />

          {/* Vehicle Routes */}
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicle/:id" element={<VehicleDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={<ProtectRouteAdmin element={<Layout />} />}
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route
            path="vehicle-brand-models"
            element={<VehicleBrandManagement />}
          />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="system-data" element={<SystemDataManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
