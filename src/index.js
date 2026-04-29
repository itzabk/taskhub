import 'dotenv/config';

import fs from 'node:fs';

import { fileURLToPath } from 'node:url';

import path from 'node:path';

import { NODE_ENV } from './configs/env.json';

import Logger from './helpers/pino';

import { forkChild, getChildProcesses } from './helpers/utils/forkChild.js';

import { dbShutdown } from './singletons/mongoDb.js';

import { redisShutdown } from './singletons/redis.js';

const __dirname = fileURLToPath(import.meta.dirname);

const __rootDir = path.resolve(__dirname, '..');

const IS_WINDOWS = process.platform === 'win32';

// Development (src) vs Production (build)
const migrationPath =
  NODE_ENV === 'production'
    ? path.join(__rootDir, 'build/migration.js')
    : path.join(__rootDir, 'src/migration.js');

const logger = new Logger();

const dbMigrationProcess = forkChild(migrationPath);

let isShuttingDown = false;

async function initMigration() {
  dbMigrationProcess.on('message', async message => {
    switch (message.action) {
      case 'notifyMigrationCompleted':
        logger.info(
          {
            file: 'mainThread',
            service: 'index',
            method: 'initMigration',
            meta: {
              message,
            },
          },
          'Migration completed successfully'
        );
        dbMigrationProcess && dbMigrationProcess.kill();

        // Dynamic import to start the actual server
        try {
          await import('./app.js');
        } catch (err) {
          logger.fatal(
            {
              file: 'mainThread',
              service: 'index',
              method: 'initMigration',
              meta: { err },
            },
            'Failed to start app after migration'
          );
          await shutdownOrchestrator(1);
        }
    }
  });

  dbMigrationProcess.on('error', async err => {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
        meta: {
          err,
        },
      },
      'Migration failed due to error'
    );
  });

  dbMigrationProcess.on('exit', async code => {
    if (code !== 0) {
      logger.fatal(
        {
          file: 'mainThread',
          service: 'index',
          method: 'initMigration',
          meta: {
            code,
          },
        },
        `Migration exited with exit code ${code}`
      );
      await shutdownOrchestrator(1);
    }
  });
}

async function shutdownOrchestrator(code = 0) {
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
    const childProcesses = getChildProcesses();
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
      `Cleanup completed successfully, process exiting with exit code:${code}`
    );
    clearTimeout(forceKill);
    process.exit(code);
  }
}

process.on('SIGINT', async signal => {
  await shutdownOrchestrator(0);
});

process.on('SIGTERM', async signal => {
  await shutdownOrchestrator(0);
});

process.on('SIGUSR2', async () => {
  await shutdownOrchestrator(0);
});

process.on('SIGHUP', async () => {
  await shutdownOrchestrator(0);
});

if (IS_WINDOWS) {
  process.on('SIGBREAK', async () => {
    await shutdownOrchestrator(0);
  });
}

process.on('uncaughtException', async err => {
  logger.fatal(
    {
      file: 'mainThread',
      service: 'index',
      method: 'uncaughtException',
      meta: {
        err,
      },
    },
    'Uncaught Exception'
  );
  await shutdownOrchestrator(1);
});

process.on('unhandledRejection', async err => {
  logger.fatal(
    {
      file: 'mainThread',
      service: 'index',
      method: 'Unhandled Rejection',
      meta: { err },
    },
    'Unhandled Rejection'
  );
  await shutdownOrchestrator(1);
});

process.on('SIGQUIT', async () => {
  try {
    const tmpPath = path.join(__rootDir, 'tmp');
    fs.mkdirSync(tmpPath, { recursive: true });
    const reportPath = path.join(tmpPath, `diagnostics-${Date.now()}.json`);
    process.report.writeReport(reportPath);
    logger.info({ reportPath }, 'Diagnostic report generated due to SIGQUIT');
    await shutdownOrchestrator(0);
  } catch (err) {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'index',
        method: 'SIGQUIT',
        meta: { err },
      },
      'Error during SIGQUIT'
    );
    process.exit(1);
  }
});

initMigration();
