import * as pinoLogger from './pino.js';

import { loggerStorage } from './loggerContext.js';

// Payload Structure
// const payload = {
//     file:"file",
//     service:"exampleService",
//     method:"fetchAll",
//     durationMS: 120  (in ms / milliseconds)
//     meta:{}
// }

class Logger {
  assert(payload, msg) {
    const { file } = payload;
    const requiredKeys = ['file', 'service', 'method'];

    const payloadKeys = Object.keys(payload);
    requiredKeys.forEach(key => {
      if (!payloadKeys.includes(key)) {
        throw new Error(`Missing key: "${key}" in logger payload: ${JSON.stringify(payload)}`);
      }
    });

    if (!pinoLogger[file]) {
      throw new Error(`Logger instance "${file}" not found in pino.js exports`);
    }

    if (!msg) {
      throw new Error(`Invalid payload message: ${JSON.stringify(payload)}`);
    }
  }

  log(level, dynamicPayload, dynamicMsg) {
    const finalPayload = dynamicPayload || {};
    const finalMsg = dynamicMsg || '';
    this.assert(finalPayload, finalMsg);

    const { file, meta = {}, ...rest } = finalPayload;

    // Support both 'error' and 'err' in meta
    const errorObj = meta.error || meta.err;
    const { error, err, ...otherMeta } = meta;

    const logData = {
      ...rest,
      ...otherMeta,
      ...(errorObj ? { err: errorObj } : {}),
    };

    const requestScopedLogger = loggerStorage.getStore();

    if (requestScopedLogger) {
      return requestScopedLogger[level]({ ...finalPayload }, finalMsg);
    }

    return pinoLogger[file][level](logData, finalMsg);
  }

  // Pass arguments through to the log method
  trace(p, m) {
    return this.log('trace', p, m);
  }
  debug(p, m) {
    return this.log('debug', p, m);
  }
  info(p, m) {
    return this.log('info', p, m);
  }
  warn(p, m) {
    return this.log('warn', p, m);
  }
  error(p, m) {
    return this.log('error', p, m);
  }
  fatal(p, m) {
    return this.log('fatal', p, m);
  }
}

export const logger = new Logger();
