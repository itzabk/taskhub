export const dbConfigs = {
  DB_URL: process.env.DB_URL,
  DB_USERNAME: process.env.DB_USERNAME || null,
  DB_PASSWORD: process.env.DB_PASSWORD || null,
  DB_CERT: process.env.DB_CERT || null,
  IS_DATABASE_CONNECTION_ENCRYPTED:
    process.env.IS_DATABASE_CONNECTION_ENCRYPTED === "true",
};
