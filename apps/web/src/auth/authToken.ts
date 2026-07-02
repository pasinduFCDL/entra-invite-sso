import { jwtDecode } from 'jwt-decode';

// Claims carried by the app session JWT (see backend AppJwtService).
export interface AuthTokenClaims {
  userId: string;
  email: string;
  role: string;
  displayName: string;
}

const AUTH_TOKEN_KEY = 'auth_token';

/** Returns the decoded app session claims, or null if missing/invalid. */
export function getAuthClaims(): AuthTokenClaims | null {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  try {
    return jwtDecode<AuthTokenClaims>(token);
  } catch {
    return null;
  }
}

/** Persists the app session token. */
export function setAuthToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** Removes the app session token (sign-out). */
export function clearAuthToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}
