import path from 'node:path';

import fs from 'node:fs';

import Redis from 'ioredis';

import { logger } from '../helpers/pino/index.js';

import { serverConfigs } from '../configs/serverConfigs.js';

const __dirname = import.meta.dirname;

const __certpath = path.resolve(__dirname, '../configs');

const { REDIS_CONFIGS, NODE_ENV } = serverConfigs;

const {
  REDIS_URL = '',
  REDIS_USERNAME = null,
  REDIS_PASSWORD = null,
  IS_REDIS_CONNECTION_ENCRYPTED = false,
  REDIS_CA = null,
  REDIS_CERT = null,
  REDIS_KEY = null,
} = REDIS_CONFIGS;

const redisConnections = new Set();

let isShuttingDown = false;

const redisConfigs = {
  connectTimeout: 10_000,
  lazyConnect: true,
  enableReadyCheck: true,
  retryStrategy: times => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  commandTimeout: 5000,
  noDelay: true,
  enableAutoPipelining: true,
  db: NODE_ENV === 'test' ? 5 : 0,
};

if (REDIS_USERNAME && REDIS_PASSWORD) {
  redisConfigs.username = REDIS_USERNAME;
  redisConfigs.password = REDIS_PASSWORD;
}

if (IS_REDIS_CONNECTION_ENCRYPTED) {
  const caPath = path.join(__certpath, 'redis-ca.pem');
  const certPath = path.join(__certpath, 'redis-cert.pem');
  const keyPath = path.join(__certpath, 'redis-key.pem');

  fs.writeFileSync(caPath, REDIS_CA);
  fs.writeFileSync(certPath, REDIS_CERT);
  fs.writeFileSync(keyPath, REDIS_KEY);

  redisConfigs.tls = {
    ca: fs.readFileSync(caPath),
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: true,
  };
}

function attachListeners(client) {
  const connectionInfo = {
    host: client.options.host,
    port: client.options.port,
    db: client.options.db,
  };
  client.on('connect', () => {
    logger.info(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'attachListeners',
        meta: { ...connectionInfo, status: client.status, pid: process.pid },
      },
      `Redis client  ${connectionInfo.host} ${connectionInfo.port}  connected successfully`
    );
  });

  client.on('ready', () => {
    logger.info(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'attachListeners',
        meta: { ...connectionInfo, clientID: client.id, pid: process.pid },
      },
      `Redis client ${connectionInfo.host} ${connectionInfo.port}  authenticated and ready for operations`
    );
  });

  client.on('reconnecting', () => {
    logger.warn(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'attachListeners',
        meta: {
          ...connectionInfo,
          status: client.status,
          nextRetryDelay: client.condition?.retryDelay || 0,
          totalRetries: client.condition?.retries || 0,
          pid: process.pid,
        },
      },
      'Redis client attempting to reconnect to server'
    );
  });

  client.on('error', err => {
    logger.error(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'attachListeners',
        meta: {
          err,
          ...connectionInfo,
          status: client.status,
          retryAttempt: client.condition?.retries || 0,
          pid: process.pid,
        },
      },
      'Error occurred during redis connection'
    );
    throw err;
  });

  client.on('close', () => {
    logger.warn(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'attachListeners',
        meta: { ...connectionInfo, status: client.status, pid: process.pid },
      },
      'Redis client connection closed'
    );
  });

  client.on('end', () => {
    logger.info(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'attachListeners',
        meta: { ...connectionInfo, status: client.status, pid: process.pid },
      },
      'Redis client connection terminated completely'
    );
  });
}

export async function createNewRedisClient(processName = 'default', overrides = {}) {
  try {
    const mergedConfigs = { ...redisConfigs, ...overrides };
    const client = new Redis(REDIS_URL, mergedConfigs);
    if (client.listenerCount('ready') === 0) {
      attachListeners(client);
    }
    await client.connect();
    const connectionEntity = { type: processName, client };
    redisConnections.add(connectionEntity);
    client.once('end', () => {
      redisConnections.delete(connectionEntity);
    });
    return client;
  } catch (err) {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'createNewClient',
        meta: { err, pid: process.pid },
      },
      'Failed to create redis client connection'
    );
    throw err;
  }
}

export async function redisShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const clients = getRedisClients();

  if (!clients.length) {
    return;
  }

  const forceKill = setTimeout(async () => {
    const killPromises = clients.map(entity => entity.client.disconnect());
    await Promise.allSettled(killPromises);
    logger.warn(
      {
        thread: 'mainThread',
        service: 'redis',
        method: 'redisShutdown',
        meta: { pid: process.pid },
      },
      'Redis connections forcibly terminated due to shutdown timeout'
    );
  }, 5000);
  forceKill.unref();

  try {
    const closePromises = clients.map(entity => entity.client.quit());

    await Promise.allSettled(closePromises);
    logger.info(
      { file: 'mainThread', service: 'redis', method: 'redisShutdown' },
      'All Redis connections closed successfully'
    );
  } catch (err) {
    logger.error(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'redisShutdown',
        meta: { err, pid: process.pid },
      },
      'Error occurred during redis shutdown process'
    );
    throw err;
  } finally {
    clearTimeout(forceKill);
  }
}

export async function duplicateRedisClient(originalClient, processName) {
  try {
    const duplicate = originalClient.duplicate();
    if (duplicate.listenerCount('ready') === 0) {
      attachListeners(duplicate);
    }
    await duplicate.connect();
    const connectionEntity = { type: processName, client: duplicate };
    redisConnections.add(connectionEntity);
    duplicate.once('end', () => {
      redisConnections.delete(connectionEntity);
    });
    return duplicate;
  } catch (err) {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'redis',
        method: 'duplicateRedisClient',
        meta: { err, pid: process.pid },
      },
      'Failed to duplicate redis client connection'
    );
    throw err;
  }
}

export function getRedisClients() {
  return Array.from(redisConnections);
}

export const defaultRedisClient = await createNewRedisClient('main');
