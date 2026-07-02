import { Navigate, Route, Routes } from 'react-router-dom';
import InviteUserPage from './features/invite/InviteUserPage';
import AcceptInvitePage from './features/accept-invite/AcceptInvitePage';
import SignInPage from './features/signin/SignInPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProtectedRoute from './auth/ProtectedRoute';

const container: React.CSSProperties = {
  maxWidth: 480,
  margin: '60px auto',
  fontFamily: 'system-ui, sans-serif',
  padding: '0 16px',
};

export default function App() {
  return (
    <div style={container}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invite"
          element={
            <ProtectedRoute requiredRole="admin">
              <InviteUserPage />
            </ProtectedRoute>
          }
        />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
