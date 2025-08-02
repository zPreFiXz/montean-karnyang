import { Toaster } from "sonner";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <>
      <Toaster
        richColors
        position="bottom-right"
        expand={false}
        duration={2000}
        closeButton
        toastOptions={{
          style: {
            fontFamily: '"Athiti", sans-serif',
            fontSize: "16px",
          },
        }}
      />
      <AppRoutes />
    </>
  );
};
export default App;
