import crypto from 'node:crypto';

import fs from 'node:fs';

import path from 'node:path';

import { serverConfigs } from './configs/serverConfigs.js';

import { redisPublisher } from './events/redisPublisher.js';

import { getRedisSubscriber } from './events/redisSubscriber.js';

import { logger } from './helpers/pino/index.js';

import { forkChild } from './helpers/utils/forkChild.js';

import { shutdownOrchestrator } from './shutdownOrchestrator.js';

import { defaultRedisClient } from './singletons/redis.js';

import { acquireMigrationLockLua, releaseMigrationLockLua } from './scripts/index.js';

import CONSTANTS from './constants/index.js';

const __dirname = import.meta.dirname;
const __rootDir = path.resolve(__dirname, '..');

const IS_WINDOWS = process.platform === 'win32';

const { NODE_ENV } = serverConfigs;

const { REDIS_TOPICS, REDIS_KEYS, MIGRATION_STATUS } = CONSTANTS;

const LOCK_TTL_SECONDS = 300;

const STATUS_TTL_SECONDS = 3600;

const MIGRATION_WAIT_TIMEOUT_MS = 5 * 60 * 1000;

const migrationPath =
  NODE_ENV === 'production'
    ? path.join(__rootDir, 'build/migration.js')
    : path.join(__rootDir, 'src/migration.js');

let appStarted = false;

async function initMigration() {
  const lockId = `${process.pid}:${crypto.randomUUID()}`;

  const currentStatus = await defaultRedisClient.get(REDIS_KEYS.migrationStatus);

  if (currentStatus === MIGRATION_STATUS.COMPLETED) {
    logger.info(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
      },
      'Database migration already completed, starting application'
    );

    await startApp();
    return;
  }

  if (currentStatus === MIGRATION_STATUS.FAILED) {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
      },
      'Previous database migration failed, aborting startup'
    );

    await shutdownOrchestrator(1);
    return;
  }

  const lockAcquired = await defaultRedisClient.eval(
    acquireMigrationLockLua,
    2,
    REDIS_KEYS.migrationLock,
    REDIS_KEYS.migrationStatus,
    lockId,
    LOCK_TTL_SECONDS,
    MIGRATION_STATUS.COMPLETED,
    MIGRATION_STATUS.IN_PROGRESS,
    STATUS_TTL_SECONDS
  );

  if (Number(lockAcquired) !== 1) {
    logger.info(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
      },
      'Another node is running database migration, waiting for completion'
    );

    try {
      await waitForMigrationCompletion();
      await startApp();
      return;
    } catch (err) {
      logger.fatal(
        {
          file: 'mainThread',
          service: 'index',
          method: 'initMigration',
          meta: { err },
        },
        'Failed while waiting for database migration to complete'
      );

      await shutdownOrchestrator(1);
      return;
    }
  }

  logger.info(
    {
      file: 'mainThread',
      service: 'index',
      method: 'initMigration',
      meta: { lockId },
    },
    `Database migration lock acquired by this node with pid ${process.pid}`
  );

  let migrationCompleted = false;

  let intentionalDisconnect = false;

  const forkConfig = {
    detached: false,
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    cwd: process.cwd(),
    serialization: 'advanced',
  };

  const dbMigrationProcess = forkChild(migrationPath, [], forkConfig);

  dbMigrationProcess.on('spawn', () => {
    logger.trace(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
      },
      'Database migration child process spawned successfully by OS'
    );
  });

  dbMigrationProcess.on('disconnect', () => {
    logger.trace(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
      },
      intentionalDisconnect
        ? 'Database migration child process IPC channel disconnected'
        : 'Database migration child process IPC channel disconnected unexpectedly'
    );
  });

  dbMigrationProcess.on('message', async message => {
    try {
      switch (message.action) {
        case 'ready':
          logger.trace(
            {
              file: 'mainThread',
              service: 'index',
              method: 'initMigration',
              meta: { message },
            },
            'Database migration child process is ready'
          );
          break;

        case 'notifyMigrationCompleted':
          migrationCompleted = true;

          logger.info(
            {
              file: 'mainThread',
              service: 'index',
              method: 'initMigration',
              meta: { message },
            },
            'Database migration completed successfully, starting application'
          );

          await handleMigrationSuccess({ lockId });

          intentionalDisconnect = true;

          if (dbMigrationProcess.connected) {
            dbMigrationProcess.send({ action: 'shutdown' });
            dbMigrationProcess.disconnect();
          }

          await startApp();
          break;

        case 'notifyMigrationFailed':
          await handleMigrationFailure({
            code: 1,
            error: message.error,
            lockId,
          });

          await shutdownOrchestrator(1);
          break;

        default:
          logger.warn(
            {
              file: 'mainThread',
              service: 'index',
              method: 'initMigration',
              meta: { message },
            },
            'Unknown message received from database migration child process'
          );
          break;
      }
    } catch (err) {
      logger.fatal(
        {
          file: 'mainThread',
          service: 'index',
          method: 'initMigration',
          meta: { err },
        },
        'Error while handling database migration child message'
      );

      await handleMigrationFailure({ code: 1, error: err, lockId });
      await shutdownOrchestrator(1);
    }
  });

  dbMigrationProcess.on('error', async err => {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'index',
        method: 'initMigration',
        meta: { err },
      },
      'Database migration process encountered a fatal error, aborting startup'
    );

    await handleMigrationFailure({ code: 1, error: err, lockId });
    await shutdownOrchestrator(1);
  });

  dbMigrationProcess.on('exit', async code => {
    if (!migrationCompleted && code !== 0) {
      logger.fatal(
        {
          file: 'mainThread',
          service: 'index',
          method: 'initMigration',
          meta: { code },
        },
        `Database migration process exited with code ${code}, aborting startup`
      );

      await handleMigrationFailure({ code, lockId });
      await shutdownOrchestrator(1);
    }
  });
}

async function startApp() {
  if (appStarted) {
    return;
  }
  try {
    appStarted = true;
    await import('./app.js');
  } catch (err) {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'index',
        method: 'startApp',
        meta: { err },
      },
      'Failed to start application after database migration completed'
    );

    await shutdownOrchestrator(1);
  }
}

async function waitForMigrationCompletion() {
  const subscriber = await getRedisSubscriber('mainThread');

  return new Promise(async (resolve, reject) => {
    let isSettled = false;

    const timeout = setTimeout(() => {
      finish(() => {
        reject(new Error('Timed out waiting for migration to complete'));
      });
    }, MIGRATION_WAIT_TIMEOUT_MS);

    const cleanup = async () => {
      clearTimeout(timeout);

      await subscriber.unsubscribe(REDIS_TOPICS.migration);

      subscriber.off('message', onMessage);
    };

    const finish = async fn => {
      if (isSettled) return;

      isSettled = true;
      await cleanup();
      fn();
    };

    const onMessage = async (channel, rawMessage) => {
      if (channel !== REDIS_TOPICS.migration) return;

      let message;

      try {
        message = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
      } catch (err) {
        logger.warn(
          {
            file: 'mainThread',
            service: 'index',
            method: 'waitForMigrationCompletion',
            meta: { rawMessage, err },
          },
          'Invalid migration Pub/Sub message received'
        );
        return;
      }

      if (message.status === MIGRATION_STATUS.COMPLETED) {
        await finish(resolve);
      }

      if (message.status === MIGRATION_STATUS.FAILED) {
        await finish(() => {
          reject(new Error(message.error || 'Migration failed on another node'));
        });
      }
    };

    try {
      subscriber.on('message', onMessage);

      await subscriber.subscribe(REDIS_TOPICS.migration);

      const latestStatus = await defaultRedisClient.get(REDIS_KEYS.migrationStatus);

      if (latestStatus === MIGRATION_STATUS.COMPLETED) {
        await finish(resolve);
      }

      if (latestStatus === MIGRATION_STATUS.FAILED) {
        await finish(() => {
          reject(new Error('Migration failed on another node'));
        });
      }
    } catch (err) {
      await finish(() => reject(err));
    }
  });
}

async function handleMigrationFailure({ code, error, lockId }) {
  const failureMessage = error?.message || error || `Migration child exited with code ${code}`;

  await defaultRedisClient.set(
    REDIS_KEYS.migrationStatus,
    MIGRATION_STATUS.FAILED,
    'EX',
    STATUS_TTL_SECONDS
  );

  await redisPublisher.publish(REDIS_TOPICS.migration, {
    status: MIGRATION_STATUS.FAILED,
    error: failureMessage,
    at: new Date().toISOString(),
  });

  await defaultRedisClient.eval(
    releaseMigrationLockLua,
    2,
    REDIS_KEYS.migrationLock,
    REDIS_KEYS.migrationStatus,
    lockId,
    MIGRATION_STATUS.FAILED,
    STATUS_TTL_SECONDS
  );
}

async function handleMigrationSuccess({ lockId }) {
  await defaultRedisClient.set(
    REDIS_KEYS.migrationStatus,
    MIGRATION_STATUS.COMPLETED,
    'EX',
    STATUS_TTL_SECONDS
  );

  await redisPublisher.publish(REDIS_TOPICS.migration, {
    status: MIGRATION_STATUS.COMPLETED,
    at: new Date().toISOString(),
  });

  await defaultRedisClient.eval(
    releaseMigrationLockLua,
    2,
    REDIS_KEYS.migrationLock,
    REDIS_KEYS.migrationStatus,
    lockId,
    MIGRATION_STATUS.COMPLETED, // ARGV[2]
    STATUS_TTL_SECONDS // ARGV[3]
  );
}

process.on('SIGINT', async () => {
  await shutdownOrchestrator(0);
});

process.on('SIGTERM', async () => {
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
      meta: { err },
    },
    'Uncaught exception encountered in main process, initiating graceful shutdown'
  );

  await shutdownOrchestrator(1);
});

process.on('unhandledRejection', async err => {
  logger.fatal(
    {
      file: 'mainThread',
      service: 'index',
      method: 'unhandledRejection',
      meta: { err },
    },
    'Unhandled promise rejection in main process, initiating graceful shutdown'
  );

  await shutdownOrchestrator(1);
});

process.on('SIGQUIT', async () => {
  try {
    const tmpPath = path.join(__rootDir, 'tmp');
    fs.mkdirSync(tmpPath, { recursive: true });

    const reportPath = path.join(tmpPath, `diagnostics-${Date.now()}.json`);
    process.report.writeReport(reportPath);

    logger.info(
      { file: 'mainThread', service: 'index', method: 'SIGQUIT', meta: { reportPath } },
      'Diagnostic report generated successfully on SIGQUIT signal'
    );

    await shutdownOrchestrator(0);
  } catch (err) {
    logger.fatal(
      {
        file: 'mainThread',
        service: 'index',
        method: 'SIGQUIT',
        meta: { err },
      },
      'Failed to generate diagnostic report on SIGQUIT signal'
    );

    process.exit(1);
  }
});

initMigration();
