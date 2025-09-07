import { Toaster } from "sonner";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <>
      <Toaster
        richColors
        position="top-center"
        expand={false}
        duration={2000}
        closeButton
        toastOptions={{
          style: {
            fontFamily: '"Athiti", sans-serif',
            fontSize: "20px",
            fontWeight: "600",
          },
        }}
      />
      <AppRoutes />
    </>
  );
};
export default App;
