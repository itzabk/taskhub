import { dbShutdown } from '../singletons/mongoDb.js';

import { redisShutdown } from '../singletons/redis.js';

import { getChildProcesses, logger } from '../helpers/index.js';

import { LOGGER_FILES } from '../constants/index.js';

let isShuttingDown = false;

const { MAIN_THREAD } = LOGGER_FILES;

export async function shutdownOrchestrator(code = 0) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  const start = process.hrtime.bigint();
  logger.trace(
    {
      file: MAIN_THREAD,
      service: 'index',
      method: 'shutdownOrchestrator',
    },
    'Application shutdown initiated, beginning graceful cleanup'
  );

  const forceKill = setTimeout(() => {
    process.exit(1);
  }, 10_000);
  forceKill.unref();

  try {
    const childProcesses = getChildProcesses() || [];
    if (childProcesses.length) {
      const childProcessPromises = [];
      for (const child of childProcesses) {
        child.send({ action: 'shutdown' });
      }
      childProcesses.forEach(child => {
        const promise = new Promise(resolve => {
          child.on('exit', resolve);
        });
        childProcessPromises.push(promise);
      });
      await Promise.allSettled(childProcessPromises);
    }
    await Promise.allSettled([redisShutdown(), dbShutdown()]);
  } catch (err) {
    logger.error(
      {
        file: MAIN_THREAD,
        service: 'index',
        method: 'shutdownOrchestrator',
        meta: { err },
      },
      'Error occurred during graceful shutdown, forcing exit'
    );
    code = 1;
  } finally {
    const end = process.hrtime.bigint();
    const durationMS = Number((end - start) / 1_000_000n);
    logger.info(
      {
        file: MAIN_THREAD,
        service: 'index',
        method: 'shutdownOrchestrator',
        durationMS,
      },
      `Application shutdown completed successfully in ${durationMS}ms, exiting with code ${code}`
    );
    clearTimeout(forceKill);
    process.exit(code);
  }
}
