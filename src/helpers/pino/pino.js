import pino from "pino";

import fs, { existsSync } from "fs";

import path from "path";

import { fileURLToPath } from "url";

import { trace } from "console";

import { NODE_ENV, LOG_CONFIG } from "../../configs/env.json";

// File Path Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootPath = path.resolve(__dirname, "../../..");
const __logPath = path.join(__rootPath, "logs/v1");

// Other constants
const IS_PROD = NODE_ENV === "production" ? true : false;

// Create logs directory if it does not exists;
fs.mkdirSync(__logPath, { recursive: true });

// Pino Configurations
const pinoConfig = {
  timestamp: pino.stdTimeFunctions.isoTime,
  level: IS_PROD
    ? LOG_CONFIG.LOG_LEVEL || "info"
    : LOG_CONFIG.LOG_LEVEL || "trace",
  // use pino pretty in non production modes for better formatting
  transport: IS_PROD
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true },
      },
};

// Custom log's
export const mainThread = pino(
  pinoConfig,
  pino.destination({
    dest: path.join(__logPath, "mainThreadInfo.log"),
  }),
);

export const apiResponse = pino(
  pinoConfig,
  pino.destination({
    dest: path.join(__logPath, "apiResponseInfo.log"),
  }),
);

export const migration = pino(
  pinoConfig,
  pino.destination({
    dest: path.join(__logPath, "migrationInfo.log"),
  }),
);

export const audit = pino(
  pinoConfig,
  pino.destination({ dest: path.join(__logPath, "auditInfo.log") }),
);
