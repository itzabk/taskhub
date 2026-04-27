import mongoose from "mongoose";

import { DB_CONFIGS } from "../configs/env.json";

import Logger from "../helpers/pino";

import fs from "fs";

import path from "path";

import { fileURLToPath } from "url";

const {
  DB_URL = "",
  DB_USERNAME = null,
  DB_PASSWORD = null,
  DB_CERT = null,
  IS_DATABASE_CONNECTION_ENCRYPTED = false,
} = DB_CONFIGS;

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const __certpath = path.resolve(__dirname, "../configs");

let shuttingDown = false;

// Global mongoose settings
mongoose.set("bufferCommands", false);

// Create logger instance
const logger = new Logger();

// Add mongoose configs
const mongooseConfigs = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 15000,
  heartbeatFrequencyMS: 10000,
  family: 0,
  readPreference: "primaryPreferred",
};

if (DB_USERNAME && DB_PASSWORD) {
  mongooseConfigs.user = DB_USERNAME;
  mongooseConfigs.pass = DB_PASSWORD;
}

if (IS_DATABASE_CONNECTION_ENCRYPTED) {
  try {
    fs.writeFileSync(path.join(__certpath, "cert.pem"), DB_CERT);
    mongooseConfigs.tls = true;
    mongooseConfigs.authSource = "$external";
    mongooseConfigs.authMechanism = "MONGODB-X509";
    mongooseConfigs.tlsCertificateKeyFile = path.join(__certpath, "cert.pem");
  } catch (err) {
    logger.error({
      file: "mainThread",
      service: "mongoDb",
      method: "dbOnDisconnected",
      meta: { err },
      message: "Unable to write certificate",
    });
  }
}

function attachListeners(conn, logger) {
  conn.on("connected", () => {
    const { name, host, port } = conn;
    logger.info(
      {
        file: "mainThread",
        service: "mongoDb",
        method: "dbConnection",
      },
      `Connected to mongo db server on ${name}:${host}:${port} successfully`,
    );
  });

  conn.on("disconnected", () => {
    logger.warn(
      {
        file: "mainThread",
        service: "mongoDb",
        method: "dbDisconnection",
      },
      `Disconnected from mongo db server`,
    );
  });

  conn.on("reconnected", () => {
    const { name, host, port } = mongoose.connection;
    logger.info(
      {
        file: "mainThread",
        service: "mongoDb",
        method: "dbReconnection",
      },
      `Reconnected to mongo db server on ${name}:${host}:${port} successfully`,
    );
  });

  conn.on("error", (err) => {
    logger.error(
      {
        file: "mainThread",
        service: "mongoDb",
        method: "dbConnectionError",
        meta: {
          err,
        },
      },
      "Error during db connection",
    );
  });
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await mongoose.connection.close();
  logger.info(
    { file: "mainThread", service: "mongoDb", method: "shutdown" },
    "Connection closed",
  );
  process.exit(0);
}

// Create global instance of db
export default async function initDb() {
  try {
    const conn = mongoose.connection;
    // Only attach if they aren't already there
    if (conn.listenerCount("connected") === 0) {
      attachListeners(conn, logger);
    }
    await mongoose.connect(DB_URL, mongooseConfigs);
    return conn;
  } catch (err) {
    logger.error(
      {
        file: "mainThread",
        service: "mongoDb",
        method: "initDb",
        meta: {
          err,
        },
      },
      "Error during db connection",
    );
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
