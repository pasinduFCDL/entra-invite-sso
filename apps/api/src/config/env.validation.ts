import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  CORS_ORIGINS: Joi.string().allow('').default(''),

  AZURE_TENANT_ID: Joi.string().required(),
  AZURE_CLIENT_ID: Joi.string().required(),
  AZURE_CLIENT_SECRET: Joi.string().required(),
  GRAPH_SCOPE: Joi.string().default('https://graph.microsoft.com/User.ReadBasic.All'),
  TARGET_INVITE_DOMAIN: Joi.string().required(),

  INVITE_JWT_SECRET: Joi.string().min(16).required(),
  INVITE_JWT_EXPIRES: Joi.string().default('3d'),
  APP_BASE_URL: Joi.string().uri().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.string().valid('true', 'false').default('true'),

  SEED_ADMIN_EMAIL: Joi.string().email().required(),
  SEED_ADMIN_NAME: Joi.string().default('Pilot Admin'),

  // App session JWT (Day 2)
  AUTH_JWT_SECRET: Joi.string().min(16).required(),
  AUTH_JWT_EXPIRES: Joi.string().default('8h'),

  // Dev-only ROPC credentials (optional; only needed when DEV_MODE=true)
  DEV_MODE: Joi.string().valid('true', 'false').default('false'),
  DEV_ADMIN_USERNAME: Joi.string().allow('').optional(),
  DEV_ADMIN_PASSWORD: Joi.string().allow('').optional(),
});
