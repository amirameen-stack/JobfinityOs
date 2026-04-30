import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-[#08182b] flex flex-col items-center justify-center gap-6 z-50">
      {/* Spinner ring */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5a]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1E6FD9] animate-spin" />
      </div>

      {/* Brand label */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[#e8eef8] text-lg font-semibold tracking-wide">
          Jobfinity
        </span>
        <span className="text-[#4a7fa5] text-xs tracking-widest uppercase">
          Loading your workspace
        </span>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#1E6FD9] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
