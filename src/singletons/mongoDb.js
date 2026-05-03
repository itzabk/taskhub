import fs from 'node:fs';

import path from 'node:path';

import mongoose from 'mongoose';

import Cluster from 'node:cluster';

import { serverConfigs } from '../configs/serverConfigs.js';

import { logger } from '../helpers/index.js';

import { addTimestampsPlugin, globalToJSONPlugin } from '../helpers/index.js';

const role = Cluster.isPrimary ? 'Primary' : 'Worker';

const { DB_CONFIGS } = serverConfigs;

const {
  DB_URL = '',
  DB_USERNAME = null,
  DB_PASSWORD = null,
  DB_CERT = null,
  IS_DATABASE_CONNECTION_ENCRYPTED = false,
} = DB_CONFIGS;

const __dirname = import.meta.dirname;

const __certpath = path.resolve(__dirname, '../configs');

let isShuttingDown = false;

// Add Plugins
mongoose.plugin(globalToJSONPlugin);
mongoose.plugin(addTimestampsPlugin);

// Global mongoose settings
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

// Add mongoose configs
const mongooseConfigs = {
  serverSelectionTimeoutMS: 20_000,
  connectTimeoutMS: 15_000,
  socketTimeoutMS: 15_000,
  heartbeatFrequencyMS: 10_000,
  family: 4,
  readPreference: 'primaryPreferred',
};

if (DB_USERNAME && DB_PASSWORD) {
  mongooseConfigs.user = DB_USERNAME;
  mongooseConfigs.pass = DB_PASSWORD;
}

if (IS_DATABASE_CONNECTION_ENCRYPTED) {
  try {
    fs.writeFileSync(path.join(__certpath, 'cert.pem'), DB_CERT);
    mongooseConfigs.tls = true;
    mongooseConfigs.authSource = '$external';
    mongooseConfigs.authMechanism = 'MONGODB-X509';
    mongooseConfigs.tlsCertificateKeyFile = path.join(__certpath, 'cert.pem');
  } catch (err) {
    logger.error(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'initDb',
        meta: { err, pid: process.pid },
      },
      `[${role}] Failed to write database certificate file (PID: ${process.pid})`
    );
    throw err;
  }
}

function attachListeners(conn, logger) {
  conn.on('connected', () => {
    const { name, host, port } = conn;
    logger.info(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'dbConnection',
        meta: { pid: process.pid },
      },
      `[${role}] Connected to MongoDB server at ${host}:${port}/${name} successfully (PID: ${process.pid})`
    );
  });

  conn.on('disconnected', () => {
    logger.warn(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'dbDisconnection',
        meta: { pid: process.pid },
      },
      `[${role}] Disconnected from MongoDB server (PID: ${process.pid})`
    );
  });

  conn.on('reconnected', () => {
    const { name, host, port } = mongoose.connection;
    logger.info(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'dbReconnection',
        meta: { pid: process.pid },
      },
      `[${role}] Reconnected to MongoDB server at ${host}:${port}/${name} successfully (PID: ${process.pid})`
    );
  });

  conn.on('error', err => {
    logger.error(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'dbConnectionError',
        meta: {
          err,
          pid: process.pid,
        },
      },
      `[${role}] Error occurred during database connection (PID: ${process.pid})`
    );
    throw err;
  });
}

export async function dbShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const forceKill = setTimeout(async () => {
    logger.warn(
      {
        thread: 'mainThread',
        service: 'mongoDb',
        method: 'dbShutdown',
        meta: { pid: process.pid },
      },
      `[${role}] MongoDB connections forcibly terminated due to shutdown timeout (PID: ${process.pid})`
    );
    // Specifying true will force kill mongo connection
    await mongoose.connection.close(true);
  }, 7000);
  forceKill.unref();

  try {
    await mongoose.connection.close();
    logger.info(
      { file: 'mainThread', service: 'mongoDb', method: 'dbShutdown', meta: { pid: process.pid } },
      `[${role}] Database connection closed successfully (PID: ${process.pid})`
    );
  } catch (err) {
    logger.error(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'dbShutdown',
        meta: { err, pid: process.pid },
      },
      `[${role}] Error occurred during database shutdown (PID: ${process.pid})`
    );
    throw err;
  } finally {
    clearTimeout(forceKill);
  }
}

// Create global instance of db
async function initDb() {
  try {
    const conn = mongoose.connection;
    // Only attach if they aren't already there
    if (conn.listenerCount('connected') === 0) {
      attachListeners(conn, logger);
    }
    // Ready state is connecting or connected already reuse connection
    if (conn.readyState === 1 || conn.readyState === 2) {
      return conn;
    }
    await mongoose.connect(DB_URL, mongooseConfigs);
    return conn;
  } catch (err) {
    logger.error(
      {
        file: 'mainThread',
        service: 'mongoDb',
        method: 'initDb',
        meta: {
          err,
          pid: process.pid,
        },
      },
      `[${role}] Error occurred during database connection initialization (PID: ${process.pid})`
    );
    throw err;
  }
}

export const db = await initDb();
