import { Link, Navigate, Route, Routes } from 'react-router-dom';
import InviteUserPage from './features/invite/InviteUserPage';
import AcceptInvitePage from './features/accept-invite/AcceptInvitePage';
import DashboardPage from './features/dashboard/DashboardPage';

const container: React.CSSProperties = {
  maxWidth: 480,
  margin: '60px auto',
  fontFamily: 'system-ui, sans-serif',
  padding: '0 16px',
};

function Home() {
  return (
    <div>
      <h2>Entra Invite </h2>
      <Link to="/invite">Invite page →</Link>
    </div>
  );
}

export default function App() {
  return (
    <div style={container}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invite" element={<InviteUserPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
