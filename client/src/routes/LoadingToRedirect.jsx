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
    return <Navigate to="/" />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-108px)]">
      <div className="w-[32px] h-[32px] rounded-full border-3 border-t-transparent border-primary animate-spin" />
    </div>
  );
};
export default LoadingToRedirect;
