import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { jwtDecode } from 'jwt-decode';
import { graphUserReadScopes } from '../../auth/msalConfig';
import { acceptInvite } from '../../api/inviteApi';

// ── Decode invite JWT client-side (no signature check — backend verifies) ──
interface InvitePayload {
  email: string;
  role: string;
  purpose: string;
  exp: number;
}

function decodeInviteToken(token: string): InvitePayload | null {
  try {
    return jwtDecode<InvitePayload>(token);
  } catch {
    return null;
  }
}

// The redirect back from Microsoft drops the original `?token=` query string,
// so the invite token is stashed here before leaving for the sign-in redirect.
const INVITE_TOKEN_KEY = 'pending_invite_token';

// ── Error code → user-friendly message map ──────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  EXPIRED_INVITATION_TOKEN: 'This invitation link has expired. Please request a new invitation.',
  INVALID_INVITATION_TOKEN: 'This invitation link is invalid. Please check the URL or request a new invitation.',
  INVALID_ENTRA_TOKEN: 'Microsoft sign-in failed or expired. Please try signing in again.',
  EMAIL_MISMATCH: 'The account you signed in with does not match the invited email address. Please sign in with the correct account.',
  USER_NOT_FOUND: 'No invitation was found for this email address.',
  INVITE_ALREADY_USED: 'This invitation has already been accepted. You can sign in directly.',
  INVITATION_EXPIRED: 'This invitation has expired. Please request a new one.',
  TOKEN_MISMATCH: 'This invitation link is no longer valid. A newer invitation may have been sent.',
};

type Stage =
  | { kind: 'initializing' }
  | { kind: 'no_token' }
  | { kind: 'ready'; payload: InvitePayload; token: string }
  | { kind: 'signing_in' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string };

const card: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 24,
  marginTop: 16,
};

export default function AcceptInvitePage() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>({ kind: 'initializing' });

  // On mount: finish a pending redirect sign-in (if returning from Microsoft),
  // otherwise resolve the invite token and show the sign-in button.
  useEffect(() => {
    (async () => {
      let redirectResult;
      try {
        redirectResult = await instance.handleRedirectPromise();
      } catch {
        setStage({ kind: 'error', message: 'Sign-in was interrupted. Please try again.' });
        return;
      }

      const urlToken = new URLSearchParams(window.location.search).get('token');
      const token = urlToken || sessionStorage.getItem(INVITE_TOKEN_KEY);

      if (!token) {
        setStage({ kind: 'no_token' });
        return;
      }

      const payload = decodeInviteToken(token);
      if (!payload || payload.purpose !== 'invite') {
        setStage({ kind: 'error', message: ERROR_MESSAGES.INVALID_INVITATION_TOKEN });
        return;
      }
      if (Date.now() / 1000 > payload.exp) {
        setStage({ kind: 'error', message: ERROR_MESSAGES.EXPIRED_INVITATION_TOKEN });
        return;
      }

      if (redirectResult?.account) {
        // Just came back from Microsoft — complete the invite immediately.
        setStage({ kind: 'processing' });
        await exchangeTokens(token, redirectResult.accessToken);
        return;
      }

      sessionStorage.setItem(INVITE_TOKEN_KEY, token);
      setStage({ kind: 'ready', payload, token });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn() {
    if (stage.kind !== 'ready') return;
    setStage({ kind: 'signing_in' });
    try {
      // Full-page redirect — browser navigates away, flow resumes on return.
      await instance.loginRedirect({
        scopes: graphUserReadScopes,
        loginHint: stage.payload.email,
        prompt: 'select_account',
      });
    } catch {
      setStage({ kind: 'error', message: 'Sign-in was interrupted. Please try again.' });
    }
  }

  async function exchangeTokens(invitationToken: string, entraToken: string) {
    try {
      const result = await acceptInvite({ invitationToken, entraToken });
      sessionStorage.setItem('auth_token', result.accessToken);
      sessionStorage.removeItem(INVITE_TOKEN_KEY);
      navigate('/', { replace: true, state: { user: result.user } });
    } catch (err: any) {
      const code: string = err?.code || 'ERROR';
      const message = ERROR_MESSAGES[code] || err?.message || 'Something went wrong. Please try again.';
      setStage({ kind: 'error', message });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (stage.kind === 'no_token') {
    return (
      <div style={card}>
        <strong>No invitation token found.</strong>
        <p>Please open the invitation URL you received, or request a new invitation.</p>
      </div>
    );
  }

  if (stage.kind === 'error') {
    return (
      <div style={{ ...card, background: '#fde8e8', borderColor: '#f5c6c6' }}>
        <strong>Unable to accept invitation</strong>
        <p>{stage.message}</p>
      </div>
    );
  }

  if (stage.kind === 'ready') {
    const { payload } = stage;
    return (
      <div style={card}>
      <h2>Accept Invite </h2>
        <p style={{ color: '#555', fontSize: 14 }}>
          Sign in with your Microsoft account to accept the invitation.
          Use the account associated with <em>{payload.email}</em>.
        </p>
        <button onClick={handleSignIn} style={{ padding: '8px 20px' }}>
          Sign in with Microsoft
        </button>
      </div>
    );
  }

  // initializing / signing_in / processing
  return (
    <div style={card}>
      <p style={{ color: "#555" }}>
        {stage.kind === "signing_in"
          ? "Redirecting to Microsoft sign-in…"
          : stage.kind === "initializing"
            ? "Loading your invitation…"
            : "Verifying your invitation…"}
      </p>
    </div>
  );
}
