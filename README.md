# Entra Invite — Invite User

Pilot validating Microsoft Entra ID (Azure AD) integration : an Admin invites a
user from the partner organization's tenant. The backend verifies the user exists in the partner
directory using the **On-Behalf-Of (OBO)** flow (the admin's delegated token), then creates/renews
a local `pending_invite` record with a 3-day invitation JWT + URL.

> SSO sign-in for invited users (consuming the invite URL)

## Structure

```
entra-invite-pilot/
├─ apps/
│  ├─ api/   # NestJS backend
│  └─ web/   # React (Vite) frontend
```

## Prerequisites

- Node 18+
- A reachable PostgreSQL instance
- Azure App Registration with:
  - Exposed API scope `access_as_user` (Application ID URI `api://<AZURE_CLIENT_ID>`)
  - Delegated Microsoft Graph permission **`User.ReadBasic.All`** with **admin consent granted**
  - A client secret (`AZURE_CLIENT_SECRET`)

## Run

### Backend
```bash
cd apps/api
cp .env.example .env   # fill in values
npm install
npm run start:dev
```
On boot it seeds the initial admin (`SEED_ADMIN_EMAIL`) if not present.

### Frontend
```bash
cd apps/web
cp .env.example .env   # fill in values
npm install
npm run dev
```

## Flow 

1. Admin signs in via MSAL in the SPA and acquires an access token for `api://<CLIENT_ID>/access_as_user`.
2. SPA `POST /api/invites { username, role }` with `Authorization: Bearer <token>`.
3. Backend validates the token (JWKS), confirms the requester is an active Admin.
4. Backend builds the UPN `<username>@<TARGET_INVITE_DOMAIN>` and verifies it exists in Entra via OBO + Graph.
5. State machine: not-in-directory → 404; already active → 409; pending → renew; new → create.
6. A 3-day invitation JWT + URL is generated and stored.
