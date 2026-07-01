export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  azure: {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    graphScope: process.env.GRAPH_SCOPE,
    targetInviteDomain: process.env.TARGET_INVITE_DOMAIN,
  },
  invite: {
    jwtSecret: process.env.INVITE_JWT_SECRET,
    jwtExpires: process.env.INVITE_JWT_EXPIRES || '3d',
    appBaseUrl: process.env.APP_BASE_URL,
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL,
    adminName: process.env.SEED_ADMIN_NAME || 'Pilot Admin',
  },
  // Dev-only: acquire the admin's delegated token via ROPC instead of an
  dev: {
    enabled: process.env.DEV_MODE === 'true',
    adminUsername: process.env.DEV_ADMIN_USERNAME,
    adminPassword: process.env.DEV_ADMIN_PASSWORD,
  },
});
