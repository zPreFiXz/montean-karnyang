import { useEffect, useState } from "react";
import { Navigate } from "react-router";

const LoadingToRedirect = () => {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirect(true);
    }, 1000);

    return () => clearTimeout(timer);
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
