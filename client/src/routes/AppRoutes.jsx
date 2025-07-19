import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import Layout from "../layouts/Layout";
import Status from "@/pages/Status";
import RepairCreate from "@/pages/RepairCreate";
import CustomerHistory from "@/pages/CustomerHistory";
import PartStock from "@/pages/PartStock";
import SuspensionCheck from "@/pages/SuspensionCheck";
import SalesReport from "@/pages/SalesReport";
import NewStock from "@/pages/NewStock";
import ProtectRouteUser from "./ProtectRouteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        <Route element={<ProtectRouteUser element={<Layout />} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="suspension-check" element={<SuspensionCheck />} />
          <Route path="repairs/new" element={<RepairCreate />} />
          <Route path="customers/history" element={<CustomerHistory />} />
          <Route path="stock/parts" element={<PartStock />} />
          <Route path="status" element={<Status />} />
          <Route path="sales/daily" element={<SalesReport />} />
          <Route path="sales/weekly" element={<SalesReport />} />
          <Route path="sales/monthly" element={<SalesReport />} />
          <Route path="sales/yearly" element={<SalesReport />} />
          <Route path="stock/new" element={<NewStock />} />
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
