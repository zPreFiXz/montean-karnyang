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

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="suspension-check" element={<SuspensionCheck />} />
          <Route path="/repairs/new" element={<RepairCreate />} />
          <Route path="/customers/history" element={<CustomerHistory />} />
          <Route path="/stock/parts" element={<PartStock />} />
          <Route path="status" element={<Status />} />
          <Route path="/sales/daily" element={<SalesReport />} />
          <Route path="/sales/weekly" element={<SalesReport />} />
          <Route path="/sales/monthly" element={<SalesReport />} />
          <Route path="/sales/yearly" element={<SalesReport />} />
          <Route path="/stock/new" element={<NewStock />} />
        </Route>

        {/* Private */}
        <Route path="admin">
          <Route index element={<h1>admin</h1>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
