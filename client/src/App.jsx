import { Toaster } from "sonner";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <>
      <Toaster
        richColors
        position="top-center"
        expand={false}
        duration={3000}
        closeButton
        toastOptions={{
          style: {
            fontFamily: '"Athiti", sans-serif',
            fontSize: "18px",
          },
        }}
      />
      <AppRoutes />
    </>
  );
};
export default App;
