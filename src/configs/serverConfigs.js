import dotenv from 'dotenv';

import path from 'node:path';

dotenv.config({
  path: path.resolve(import.meta.dirname, '../../.env'),
});

export const serverConfigs = {
  NODE_ENV: process.env.NODE_ENV,

  LOG_CONFIGS: {
    LOG_LEVEL: process.env.LOG_LEVEL,
  },

  DB_CONFIGS: {
    DB_URL: process.env.DB_URL,
    DB_USERNAME: process.env.DB_USERNAME || null,
    DB_PASSWORD: process.env.DB_PASSWORD || null,
    DB_CERT: process.env.DB_CERT || null,
    IS_DATABASE_CONNECTION_ENCRYPTED: process.env.IS_DATABASE_CONNECTION_ENCRYPTED === 'true',
  },

  REDIS_CONFIGS: {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_USERNAME: process.env.REDIS_USERNAME || null,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || null,
    IS_REDIS_CONNECTION_ENCRYPTED: process.env.IS_REDIS_CONNECTION_ENCRYPTED === 'true',
    REDIS_CA: process.env.REDIS_CA,
    REDIS_CERT: process.env.REDIS_CERT,
    REDIS_KEY: process.env.REDIS_KEY,
  },

  EXPRESS_WORKERS: Number(process.env.EXPRESS_WORKERS || 2),
};
