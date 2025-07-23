import { useEffect, useState } from "react";
import { Navigate } from "react-router";

const LoadingToRedirect = () => {
  const [count, setCount] = useState(3);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Please Login
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm mb-6">
            You need to login to access this page
          </p>

          {/* Simple Countdown */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-blue-600">{count}</span>
            <p className="text-xs text-gray-500 mt-1">
              Redirecting to login...
            </p>
          </div>

          {/* Simple Button */}
          <button
            onClick={() => setRedirect(true)}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Login now
          </button>
        </div>
      </div>
    </div>
  );
};
export default LoadingToRedirect;
