import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { graphUserReadScopes, signInRedirectUri } from '../../auth/msalConfig';
import { setAuthToken } from '../../auth/authToken';
import { signIn } from '../../api/inviteApi';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_ENTRA_TOKEN: 'Microsoft sign-in failed or expired. Please try signing in again.',
  USER_NOT_IN_DIRECTORY: 'Your account was not found in the organization directory.',
  USER_NOT_FOUND: 'No account was found for this email.',
  ACCOUNT_NOT_ACTIVE: 'Your invitation has not been accepted yet. Please use your invitation link first.',
};

type Stage =
  | { kind: 'initializing' }
  | { kind: 'ready' }
  | { kind: 'signing_in' }
  | { kind: 'processing' }
  | { kind: 'error'; message: string };

const card: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 24,
  marginTop: 16,
};

export default function SignInPage() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>({ kind: 'initializing' });

  // On mount: finish a pending redirect sign-in (if returning from Microsoft),
  // otherwise show the sign-in button.
  useEffect(() => {
    (async () => {
      let redirectResult;
      try {
        redirectResult = await instance.handleRedirectPromise();
      } catch {
        setStage({ kind: 'error', message: 'Sign-in was interrupted. Please try again.' });
        return;
      }

      if (redirectResult?.account) {
        setStage({ kind: 'processing' });
        await exchangeTokens(redirectResult.accessToken);
        return;
      }

      setStage({ kind: 'ready' });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn() {
    setStage({ kind: 'signing_in' });
    try {
      // Full-page redirect — browser navigates away, flow resumes on return.
      await instance.loginRedirect({
        scopes: graphUserReadScopes,
        prompt: 'select_account',
        redirectUri: signInRedirectUri,
      });
    } catch {
      setStage({ kind: 'error', message: 'Sign-in was interrupted. Please try again.' });
    }
  }

  async function exchangeTokens(entraToken: string) {
    try {
      const result = await signIn({ entraToken });
      setAuthToken(result.accessToken);
      navigate('/', { replace: true, state: { user: result.user } });
    } catch (err: any) {
      const code: string = err?.code || 'ERROR';
      const message = ERROR_MESSAGES[code] || err?.message || 'Something went wrong. Please try again.';
      setStage({ kind: 'error', message });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (stage.kind === 'error') {
    return (
      <div style={{ ...card, background: '#fde8e8', borderColor: '#f5c6c6' }}>
        <strong>Unable to sign in</strong>
        <p>{stage.message}</p>
      </div>
    );
  }

  if (stage.kind === 'ready') {
    return (
      <div style={card}>
        <h2>Sign In</h2>
        <p style={{ color: '#555', fontSize: 14 }}>Sign in with your Microsoft account.</p>
        <button onClick={handleSignIn} style={{ padding: '8px 20px' }}>
          Sign in with Microsoft
        </button>
      </div>
    );
  }

  // initializing / signing_in / processing
  return (
    <div style={card}>
      <p style={{ color: '#555' }}>
        {stage.kind === 'signing_in'
          ? 'Redirecting to Microsoft sign-in…'
          : stage.kind === 'initializing'
            ? 'Loading…'
            : 'Signing you in…'}
      </p>
    </div>
  );
}
