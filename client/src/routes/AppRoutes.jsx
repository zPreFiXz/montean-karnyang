import { createElement, lazy, Suspense, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router";
import Layout from "@/layouts/Layout";
import { pageImports } from "@/routes/pageImports";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import GuestRoute from "@/routes/GuestRoute";

const Login = lazy(pageImports.Login);
const Dashboard = lazy(pageImports.Dashboard);
const VehicleModelList = lazy(pageImports.VehicleModelList);
const SuspensionInspection = lazy(pageImports.SuspensionInspection);
const RepairCreate = lazy(pageImports.RepairCreate);
const RepairReview = lazy(pageImports.RepairReview);
const RepairList = lazy(pageImports.RepairList);
const RepairDetail = lazy(pageImports.RepairDetail);
const InventoryList = lazy(pageImports.InventoryList);
const InventoryForm = lazy(pageImports.InventoryForm);
const InventoryUsage = lazy(pageImports.InventoryUsage);
const OrganizationList = lazy(pageImports.OrganizationList);
const OrganizationDetail = lazy(pageImports.OrganizationDetail);
const OrganizationHistory = lazy(pageImports.OrganizationHistory);
const VehicleList = lazy(pageImports.VehicleList);
const VehicleDetail = lazy(pageImports.VehicleDetail);
const UserList = lazy(pageImports.UserList);
const EmployeeList = lazy(pageImports.EmployeeList);
const SalesReport = lazy(pageImports.SalesReport);
const TopItemsReport = lazy(pageImports.TopItemsReport);
const AttendanceReport = lazy(pageImports.AttendanceReport);
const NotFound = lazy(pageImports.NotFound);

// ผูก key กับบิลที่แก้ ไม่งั้นกดปุ่มบวกระหว่างแก้บิล หน้าไม่เริ่มใหม่แล้วบันทึกเป็นบิลซ้ำ
const BillPage = ({ page }) => {
  const location = useLocation();
  const editRepairId = location.state?.editRepairId;

  return createElement(page, {
    key: editRepairId ? `edit-${editRepairId}` : "new",
  });
};

// ไดอะล็อกล็อกการคลิกทั้งหน้าระหว่างปิด ถ้าเปลี่ยนหน้าระหว่างนั้นตัวมันถูกถอดก่อนได้ปลด
// หน้าใหม่จะกดอะไรไม่ติด จึงต้องปลดเองทุกครั้งที่เปลี่ยนหน้า
const UnlockPointerEvents = () => {
  const location = useLocation();

  useEffect(() => {
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
  }, [location.pathname, location.search]);

  return null;
};

const RouteFallback = () => (
  <div className="flex min-h-svh items-center justify-center">
    <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <UnlockPointerEvents />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <GuestRoute element={<Login />} />
            </Suspense>
          }
        />

        <Route element={<ProtectedRoute element={<Layout />} />}>
          <Route path="dashboard" element={<Dashboard />} />

          <Route
            path="inspections/suspension"
            element={<BillPage page={SuspensionInspection} />}
          />

          <Route path="repairs" element={<RepairList />} />
          <Route
            path="repairs/new"
            element={<BillPage page={RepairCreate} />}
          />
          <Route path="repairs/review" element={<RepairReview />} />
          <Route path="repairs/:id" element={<RepairDetail />} />

          <Route path="organizations" element={<OrganizationList />} />
          <Route
            path="organizations/:id/history"
            element={<OrganizationHistory />}
          />
          <Route path="organizations/:id" element={<OrganizationDetail />} />

          <Route path="inventory" element={<InventoryList />} />
          <Route path="inventory/new" element={<InventoryForm />} />
          <Route
            path="inventory/:type/:id/usage"
            element={<InventoryUsage />}
          />
          <Route path="inventory/:id" element={<InventoryForm />} />

          <Route path="vehicles" element={<VehicleList />} />
          <Route path="vehicles/models" element={<VehicleModelList />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
        </Route>

        <Route path="admin" element={<AdminRoute element={<Layout />} />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserList />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="reports/sales" element={<SalesReport />} />
          <Route path="reports/top-items" element={<TopItemsReport />} />
          <Route path="reports/attendance" element={<AttendanceReport />} />
        </Route>

        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
