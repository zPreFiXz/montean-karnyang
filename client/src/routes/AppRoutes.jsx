import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "../pages/Dashboard";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
