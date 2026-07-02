import { Configuration, PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    // App registration is single-tenant, so `/common` is rejected by Entra
    // (AADSTS50194). Invited users must be guests in this tenant.
    authority: `https://login.microsoftonline.com/${tenantId}`,
    // Must land back on /accept-invite (not just the origin) so this page can
    // process the redirect response. Register this exact URI as a SPA
    // redirect URI in the Entra app registration.
    redirectUri: `${window.location.origin}/accept-invite`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scope used by the accept-invite page: read the signed-in user's own profile.
// User.Read is a standard delegated scope — users can self-consent, no admin consent needed.
export const graphUserReadScopes = ['https://graph.microsoft.com/User.Read'];

// Scope for the backend API (used by the future Day 1 production admin sign-in).
export const apiScopes = [import.meta.env.VITE_API_SCOPE];

export const loginRequest = {
  scopes: ['openid', 'profile', ...apiScopes],
};

export const msalInstance = new PublicClientApplication(msalConfig);
