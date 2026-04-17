import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useIsAdmin } from "../../hooks/use-backend";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated, loginStatus } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  useEffect(() => {
    if (loginStatus === "idle" || loginStatus === "logging-in") return;

    if (!isAuthenticated) {
      navigate({ to: "/" });
      return;
    }

    if (adminOnly && !adminLoading && isAdmin === false) {
      navigate({ to: "/dashboard" });
    }
  }, [
    isAuthenticated,
    loginStatus,
    adminOnly,
    isAdmin,
    adminLoading,
    navigate,
  ]);

  if (loginStatus === "idle" || loginStatus === "logging-in") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="flex flex-col items-center gap-4"
          data-ocid="protected_route.loading_state"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-mono tracking-wider">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="flex flex-col items-center gap-4"
          data-ocid="protected_route.loading_state"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-mono tracking-wider">
            Verifying access...
          </span>
        </div>
      </div>
    );
  }
  if (adminOnly && !isAdmin) return null;

  return <>{children}</>;
}
