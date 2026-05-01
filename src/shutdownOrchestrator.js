import { dbShutdown } from './singletons/mongoDb.js';

import { redisShutdown } from './singletons/redis.js';

import { getChildProcesses } from './helpers/utils/forkChild.js';

import { logger } from './helpers/pino/index.js';

let isShuttingDown = false;

export async function shutdownOrchestrator(code = 0) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  const start = process.hrtime.bigint();
  logger.trace(
    {
      file: 'mainThread',
      service: 'index',
      method: 'shutdownOrchestrator',
    },
    `Cleanup started successfully`
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
        file: 'mainThread',
        service: 'index',
        method: 'shutdownOrchestrator',
        meta: { err },
      },
      'Error during orchestrator cleanup'
    );
    code = 1;
  } finally {
    const end = process.hrtime.bigint();
    const durationMS = Number((end - start) / 1_000_000n);
    logger.info(
      {
        file: 'mainThread',
        service: 'index',
        method: 'shutdownOrchestrator',
        durationMS,
      },
      `Cleanup completed, process exiting with exit code:${code}`
    );
    clearTimeout(forceKill);
    process.exit(code);
  }
}
