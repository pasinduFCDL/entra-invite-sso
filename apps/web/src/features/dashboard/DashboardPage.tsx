import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface DashboardUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

const card: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 24,
  marginTop: 16,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = (location.state as { user?: DashboardUser } | null)?.user;

  useEffect(() => {
    if (!sessionStorage.getItem('auth_token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={card}>
      <h2>Dashboard</h2>
      {user ? (
        <p>
          Welcome, <strong>{user.displayName || user.email}</strong>.
        </p>
      ) : (
        <p>You're signed in.</p>
      )}
    </div>
  );
}
