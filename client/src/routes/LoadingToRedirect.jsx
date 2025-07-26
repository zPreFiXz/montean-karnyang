import { useEffect, useState } from "react";
import { Navigate } from "react-router";

const LoadingToRedirect = () => {
  const [count, setCount] = useState(2);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((currentCount) => {
        if (currentCount === 1) {
          clearInterval(interval);
          setRedirect(true);
        }
        return currentCount - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (redirect) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[32px] h-[32px] border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};
export default LoadingToRedirect;
