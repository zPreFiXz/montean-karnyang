import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "../layouts/Layout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import SalesReport from "@/pages/reports/SalesReport";
import RepairStatus from "@/pages/repairs/RepairStatus";
import Suspension from "@/pages/inspections/Suspension";
import CreateRepair from "@/pages/repairs/CreateRepair";
import RepairSummary from "@/pages/repairs/RepairSummary";
import RepairDetail from "@/pages/repairs/RepairDetail";
import Inventory from "@/pages/inventory/Inventory";
import CreateItem from "@/pages/inventory/CreateItem";
import ItemDetail from "@/pages/inventory/ItemDetail";
import Customers from "@/pages/customers/Customers";
import CustomerDetail from "@/pages/customers/CustomerDetail";
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
          <Route path="repairs/new" element={<CreateRepair />} />
          <Route path="repairs/summary" element={<RepairSummary />} />
          <Route path="repairs/status/:status" element={<RepairStatus />} />
          <Route path="repairs/:id" element={<RepairDetail />} />

          {/* Inventory Routes */}
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/new" element={<CreateItem />} />
          <Route path="inventory/:id" element={<ItemDetail />} />

          {/* Customer Routes */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={<ProtectRouteAdmin element={<Layout />} />}
        >
          <Route index element={<h1>admin</h1>} />
        </Route>

        {/* Not Found Route */}
        <Route
          path="*"
          element={<ProtectRouteGuest element={<NotFound />} />}
        />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
