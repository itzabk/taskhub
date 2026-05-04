import path from 'node:path';

import Cluster from 'node:cluster';

import fs from 'node:fs';

import pino from 'pino';

import { serverConfigs } from '../../configs/serverConfigs.js';

const { LOG_CONFIGS, NODE_ENV, APP_NODE } = serverConfigs;

// File Path Constants
const __dirname = import.meta.dirname;
const __rootPath = path.resolve(__dirname, '../../..');
const __logPath = path.join(__rootPath, `logs/${APP_NODE}/v1`);

// Other constants
const IS_PROD = NODE_ENV === 'production' ? true : false;

// Create logs directory if it does not exists;
fs.mkdirSync(__logPath, { recursive: true });

// Pino Configurations
const pinoConfig = {
  base: {
    pid: process.pid,
    workerId: Cluster.worker ? Cluster.worker.id : undefined,
    role: Cluster.isPrimary ? 'Primary' : 'Worker',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  level: IS_PROD ? LOG_CONFIGS.LOG_LEVEL || 'info' : LOG_CONFIGS.LOG_LEVEL || 'trace',
  // use pino pretty in non production modes for better formatting
  transport: IS_PROD
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true },
      },
};

// Custom log's
export const mainThread = pino(
  pinoConfig,
  pino.destination({
    minLength: 4096,
    sync: false,
    dest: path.join(__logPath, 'mainThreadInfo.log'),
  })
);

export const apiResponse = pino(
  pinoConfig,
  pino.destination({
    minLength: 4096,
    sync: false,
    dest: path.join(__logPath, 'apiResponseInfo.log'),
  })
);

export const migration = pino(
  pinoConfig,
  pino.destination({
    minLength: 4096,
    sync: false,
    dest: path.join(__logPath, 'migrationInfo.log'),
  })
);

export const audit = pino(
  pinoConfig,
  pino.destination({
    minLength: 4096,
    sync: false,
    dest: path.join(__logPath, 'auditInfo.log'),
  })
);

export const expressWorker = pino(
  pinoConfig,
  pino.destination({
    minLength: 4096,
    sync: false,
    dest: path.join(__logPath, 'expressWorkerInfo.log'),
  })
);

export const redisPubSub = pino(
  pinoConfig,
  pino.destination({
    minLength: 4096,
    sync: false,
    dest: path.join(__logPath, 'redisPubSubInfo.log'),
  })
);
