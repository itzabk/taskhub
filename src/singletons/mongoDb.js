import mongoose from "mongoose";

import { dbConfigs } from "../configs/dbConfigs";

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
} = dbConfigs;

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const __certpath = path.resolve(__dirname, "../configs");

let shuttingDown = false;

// Global mongoose settings
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

// Create logger instance
const logger = new Logger();

// Add mongoose configs
const mongooseConfigs = {
  serverSelectionTimeoutMS: 20_000,
  connectTimeoutMS: 15_000,
  socketTimeoutMS: 15_000,
  heartbeatFrequencyMS: 10_000,
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
    throw err;
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
    throw err;
  });
}

export async function dbShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await mongoose.connection.close();
  logger.info(
    { file: "mainThread", service: "mongoDb", method: "shutdown" },
    "Connection closed",
  );
}

// Create global instance of db
export async function initDb() {
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
    throw err;
  }
}
