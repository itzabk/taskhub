export const serverConfigs = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NODE: process.env.APP_NODE || 'app1',
  PORT: process.env.PORT || 3000,

  LOG_CONFIGS: {
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
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
  ALLOWED_EXTERNAL_ORIGINS: process.env.ALLOWED_EXTERNAL_ORIGINS,
  COOKIE_SECRET: process.env.COOKIE_SECRET,

  GOOGLE: {
    AUTH_KEY: process.env.GOOGLE_AUTH_KEY,
    AUTH_REDIRECT_URI: process.env.GOOGLE_AUTH_REDIRECT_URI,
    AUTH_CLIENT_SECRET: process.env.GOOGLE_AUTH_CLIENT_SECRET,
  },

  LINKEDIN: {
    AUTH_KEY: process.env.LINKEDIN_AUTH_KEY,
    AUTH_REDIRECT_URI: process.env.LINKEDIN_AUTH_REDIRECT_URI,
    AUTH_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  },

  JWT: {
    PRIVATE_KEY_PATH: process.env.JWT_PRIVATE_KEY_PATH,
    PUBLIC_KEY_PATH: process.env.JWT_PUBLIC_KEY_PATH,
    ALGORITHM: process.env.JWT_ALGORITHM,
  },

  OTEL: {
    EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318',
    EXPORTER_OTLP_TRACES_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
    EXPORTER_OTLP_METRICS_ENDPOINT: 'http://127.0.0.1:4318/v1/metrics',
    SERVICE_NAME: 'taskhub-api',
    SERVICE_VERSION: '1.0.0',
    DEPLOYMENT_ENVIRONMENT: 'development',
    TRACE_SAMPLE_RATIO: 1,
  },
};
