import { IPublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { apiScopes } from '../auth/msalConfig';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface InviteRequest {
  username: string;
  role: string;
}

export interface InviteSuccess {
  code: 'INVITE_CREATED' | 'INVITE_RENEWED';
  userId: string;
  email: string;
  role: string;
  invitationUrl: string;
  expiresAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

function parseError(status: number, data: any): ApiError {
  // Nest sends custom exception bodies as the payload directly; validation
  // errors nest an array under `message`.
  const payload = data?.message && typeof data.message === 'object' ? data.message : data;
  return {
    code: payload?.code || 'ERROR',
    message: payload?.message || 'Request failed',
    statusCode: status,
  };
}

/**
 * DEV: submits an invite without signing in. The backend acquires the admin's
 * delegated token via ROPC and runs the real OBO flow. Used by the /invite page
 */
export async function submitInviteDev(body: InviteRequest): Promise<InviteSuccess> {
  const res = await fetch(`${API_BASE}/invites/dev`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(res.status, data);
  return data as InviteSuccess;
}

/**
 * Acquires the backend API access token (token #1) for the signed-in admin and
 * submits the invite request.
 */
export async function submitInvite(
  instance: IPublicClientApplication,
  account: AccountInfo,
  body: InviteRequest,
): Promise<InviteSuccess> {
  const { accessToken } = await instance.acquireTokenSilent({
    scopes: apiScopes,
    account,
  });

  const res = await fetch(`${API_BASE}/invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Nest wraps custom exception bodies under the response payload.
    const payload = data?.message && typeof data.message === 'object' ? data.message : data;
    const err: ApiError = {
      code: payload?.code || 'ERROR',
      message: payload?.message || 'Request failed',
      statusCode: res.status,
    };
    throw err;
  }

  return data as InviteSuccess;
}
