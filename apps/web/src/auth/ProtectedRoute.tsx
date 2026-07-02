import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = !!sessionStorage.getItem('auth_token');
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
}
