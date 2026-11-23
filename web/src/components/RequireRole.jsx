import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { HOME_BY_ROLE } from "../lib/access.js";

/** Route guard. Signed-out visitors go to /login; signed-in users with the wrong role go to their own home. */
export function RequireRole({ roles }) {
  const { isSignedIn, role } = useAuth();
  const location = useLocation();

  if (!isSignedIn) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!roles.includes(role)) {
    return <Navigate to={HOME_BY_ROLE[role]} replace />;
  }
  return <Outlet />;
}
