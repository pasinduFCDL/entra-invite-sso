import { Link, Navigate, Route, Routes } from 'react-router-dom';
import InviteUserPage from './features/invite/InviteUserPage';

const container: React.CSSProperties = {
  maxWidth: 480,
  margin: '60px auto',
  fontFamily: 'system-ui, sans-serif',
  padding: '0 16px',
};

function Home() {
  return (
    <div>
      <Link to="/invite">Go to Invite page →</Link>
    </div>
  );
}

export default function App() {
  return (
    <div style={container}>
      <h1>Entra Invite</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invite" element={<InviteUserPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
