import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "../layouts/Layout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import SalesReport from "@/pages/reports/SalesReport";
import RepairStatus from "@/pages/repairs/RepairStatus";
import SuspensionCheckPage from "@/pages/SuspensionCheckPage";
import CreateRepair from "@/pages/repairs/CreateRepair";
import InventoryPart from "@/pages/inventory/InventoryPart";
import AddInventory from "@/pages/inventory/AddInventory";
import CustomerHistory from "@/pages/customers/CustomerHistory";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import ProtectRouteGuest from "./ProtectRouteGuest";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<ProtectRouteGuest element={<Login />} />} />
        <Route path="/register" element={<ProtectRouteGuest element={<Register />} />} />

        {/* User Routes */}
        <Route element={<ProtectRouteUser element={<Layout />} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="inspection/suspension" element={<SuspensionCheckPage />} />

          <Route path="reports/sales/daily" element={<SalesReport />} />
          <Route path="reports/sales/weekly" element={<SalesReport />} />
          <Route path="reports/sales/monthly" element={<SalesReport />} />
          <Route path="reports/sales/yearly" element={<SalesReport />} />

          <Route path="repairs/new" element={<CreateRepair />} />
          <Route path="repairs/status/inprogress" element={<RepairStatus />} />
          <Route path="repairs/status/completed" element={<RepairStatus />} />
          <Route path="repairs/status/paid" element={<RepairStatus />} />

          <Route path="inventory/new" element={<AddInventory />} />
          <Route path="inventory/parts" element={<InventoryPart />} />

          <Route path="customers/history" element={<CustomerHistory />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="admin"
          element={<ProtectRouteAdmin element={<Layout />} />}
        >
          <Route index element={<h1>admin</h1>} />
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
