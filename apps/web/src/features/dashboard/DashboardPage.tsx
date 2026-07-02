import { useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { jwtDecode } from 'jwt-decode';

interface DashboardUser {
  id: string;
  email: string;
  role: string;
  displayName?: string;
}

// Claims carried by the app session JWT (see backend AppJwtService).
interface AuthTokenClaims {
  userId: string;
  email: string;
  role: string;
}

const card: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 24,
  marginTop: 16,
};

function useCurrentUser(): DashboardUser | null {
  const location = useLocation();
  const navUser = (location.state as { user?: DashboardUser } | null)?.user;

  const token = sessionStorage.getItem('auth_token');
  if (!token) return navUser ?? null;

  try {
    const claims = jwtDecode<AuthTokenClaims>(token);
    return {
      id: claims.userId,
      email: claims.email,
      role: claims.role,
      displayName: navUser?.displayName,
    };
  } catch {
    return navUser ?? null;
  }
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const { instance } = useMsal();

  function handleSignOut() {
    sessionStorage.removeItem('auth_token');
    instance.clearCache().catch(() => {});
    window.location.assign('/signin');
  }

  return (
    <div style={card}>
      <h2>Dashboard</h2>
      {user ? (
        <p>
          You're signed in, <strong>{user.displayName || user.email}</strong>
        </p>
      ) : (
        <p>You're signed in.</p>
      )}
      <button onClick={handleSignOut} style={{ padding: "8px 20px", marginTop: 12 }}>
        Sign out
      </button>
    </div>
  );
}
