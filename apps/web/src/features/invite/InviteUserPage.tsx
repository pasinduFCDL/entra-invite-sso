import { FormEvent, useState } from 'react';
import { submitInviteDev, InviteSuccess, ApiError } from '../../api/inviteApi';

const ROLES = ['member', 'viewer', 'admin'];

type Feedback =
  | { kind: 'success'; data: InviteSuccess }
  | { kind: 'warning'; message: string }
  | { kind: 'error'; message: string }
  | null;

export default function InviteUserPage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const data = await submitInviteDev({ username, role });
      setFeedback({ kind: 'success', data });
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'ALREADY_REGISTERED') {
        setFeedback({ kind: 'warning', message: 'This user is already registered.' });
      } else if (err.code === 'USER_NOT_IN_DIRECTORY') {
        setFeedback({
          kind: 'error',
          message: "No matching user was found in the organization's directory.",
        });
      } else {
        setFeedback({ kind: 'error', message: err.message || 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Invite User</h2>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', marginBottom: 4 }}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
           // placeholder="jane"
            required
            style={{ display: 'block', padding: 8, width: '100%', marginTop: 4 }}
          />
        </label>
        <small style={{ color: '#888', display: 'block', marginBottom: 12 }}>
          Enter the username only — the organization domain is appended automatically.
        </small>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ display: 'block', padding: 8, width: '100%', marginTop: 4 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={loading || !username}>
          {loading ? 'Inviting…' : 'Invite'}
        </button>
      </form>

      {feedback?.kind === 'success' && (
        <div style={{ marginTop: 16, padding: 12, background: '#e6f4ea', borderRadius: 6 }}>
          <strong>
            {feedback.data.code === 'INVITE_RENEWED' ? 'Invitation renewed' : 'Invitation created'}
          </strong>{' '}
          for {feedback.data.email} ({feedback.data.role}).
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <code style={{ wordBreak: 'break-all' }}>{feedback.data.invitationUrl}</code>
          </div>
        </div>
      )}

      {feedback?.kind === 'warning' && (
        <div style={{ marginTop: 16, padding: 12, background: '#fff4e5', borderRadius: 6 }}>
          {feedback.message}
        </div>
      )}

      {feedback?.kind === 'error' && (
        <div style={{ marginTop: 16, padding: 12, background: '#fde8e8', borderRadius: 6 }}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
