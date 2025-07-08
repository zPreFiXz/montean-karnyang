import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import Layout from "../layouts/Layout";
import Status from "@/pages/Status";
import { NewRepair } from "@/pages/NewRepair";
import CheckSuspension from "../pages/CheckSuspension";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="check-suspension" element={<CheckSuspension />} />
          <Route path="status" element={<Status />} />
          <Route path="new" element={<NewRepair/>} />
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
