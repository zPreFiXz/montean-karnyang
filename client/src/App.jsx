import { Toaster } from "sonner";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <div>
      <Toaster
        richColors
        position="top-center"
        expand={false}
        duration={3000}
        toastOptions={{
          style: {
            fontFamily: '"Athiti", sans-serif',
            fontSize: "20px",
            fontWeight: "500",
          },
        }}
      />
      <AppRoutes />
    </div>
  );
};
export default App;
