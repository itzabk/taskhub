import * as logger from "./pino";

// Payload Structure
// const payload = {
//     file:"file",
//     service:"exampleService",
//     method:"fetchAll",
//     duration: 120  (in ms / milliseconds)
//     meta:{}
// }

export default class Logger {
  constructor(payload, msg) {
    this.payload = payload || {};
    this.msg = msg || "";
  }

  assert(payload = {}, msg = "") {
    const requiredKeys = ["file", "service", "method"];
    // Check if required keys exists in payload
    const payloadKeys = Object.keys(payload);
    requiredKeys.forEach((key) => {
      if (!payloadKeys.includes(key)) {
        throw new Error(
          `Missing key: "${key}" in logger payload:`,
          JSON.stringify(payload, null, 2),
        );
      }
    });

    // Checkif logger exists;
    if (!logger[file]) {
      throw new Error(`Logger "${file}" not found`);
    }
    // Check if message is not empty
    if (!msg) {
      throw new Error(`Invalid payload message: ${JSON.stringify(payload)}`);
    }
  }

  log(level) {
    this.assert(this.payload, this.msg);

    const { file, meta = {}, ...rest } = this.payload;
    const { error, ...otherMeta } = meta;

    const logData = {
      ...rest,
      ...otherMeta,
      ...(error ? { err: error } : {}),
    };

    return logger[file][level](logData, this.msg);
  }

  trace() {
    return this.log("trace");
  }
  debug() {
    return this.log("debug");
  }
  info() {
    return this.log("info");
  }
  warn() {
    return this.log("warn");
  }
  error() {
    return this.log("error");
  }
  fatal() {
    return this.log("fatal");
  }
}
