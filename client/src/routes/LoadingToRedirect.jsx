import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { TIMING } from "@/utils/constants";

const LoadingToRedirect = () => {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRedirect(true);
    }, TIMING.LOADING_DELAY);

    return () => clearTimeout(timeout);
  }, []);

  if (redirect) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-[calc(100vh-108px)] items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" />
    </div>
  );
};

export default LoadingToRedirect;
