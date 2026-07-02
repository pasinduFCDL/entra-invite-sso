import { Navigate } from 'react-router-dom';
import { getAuthClaims } from './authToken';

interface ProtectedRouteProps {
  children: JSX.Element;
  /** If set, only users with this role may access the route. */
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const claims = getAuthClaims();

  if (!claims) return <Navigate to="/signin" replace />;

  if (requiredRole && claims.role !== requiredRole) {
    // Signed in but lacking the required role — send back to the dashboard.
    return <Navigate to="/" replace />;
  }

  return children;
}
