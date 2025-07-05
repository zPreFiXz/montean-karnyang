import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import Layout from "../layouts/Layout";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
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
