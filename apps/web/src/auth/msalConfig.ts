import { Configuration, PublicClientApplication } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scope for signing in (ID token + the backend API access token).
export const apiScopes = [import.meta.env.VITE_API_SCOPE];

export const loginRequest = {
  scopes: ['openid', 'profile', ...apiScopes],
};

export const msalInstance = new PublicClientApplication(msalConfig);
