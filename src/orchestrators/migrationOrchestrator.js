import crypto from 'node:crypto';

import path from 'node:path';

import { serverConfigs } from '../configs/serverConfigs.js';

import { redisPublisher } from '../events/redisPublisher.js';

import { getRedisSubscriber } from '../events/redisSubscriber.js';

import { forkChild, logger } from '../helpers/index.js';

import { shutdownOrchestrator } from './shutdownOrchestrator.js';

import { defaultRedisClient } from '../singletons/redis.js';

import { acquireMigrationLockLua, releaseMigrationLockLua } from '../scripts/index.js';

import {
  LOCK_TTL_SECONDS,
  LOGGER_FILES,
  MIGRATION_STATUS,
  MIGRATION_WAIT_TIMEOUT_MS,
  REDIS_KEYS,
  REDIS_TOPICS,
  STATUS_TTL_SECONDS,
} from '../constants/index.js';

const __dirname = import.meta.dirname;
const __rootDir = path.resolve(__dirname, '../..');

const { NODE_ENV } = serverConfigs;

const migrationPath =
  NODE_ENV === 'production'
    ? path.join(__rootDir, 'build/migration.js')
    : path.join(__rootDir, 'src/migration.js');

let appStarted = false;

const { MAIN_THREAD } = LOGGER_FILES;

export async function initMigrationAndStartApp() {
  const lockId = `${process.pid}:${crypto.randomUUID()}`;

  const currentStatus = await defaultRedisClient.get(REDIS_KEYS.migrationStatus);

  if (currentStatus === MIGRATION_STATUS.COMPLETED) {
    logger.info(
      {
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'initMigrationAndStartApp',
      },
      'Database migration already completed, starting application'
    );

    await startApp();
    return;
  }

  if (currentStatus === MIGRATION_STATUS.FAILED) {
    logger.fatal(
      {
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'initMigrationAndStartApp',
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
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'initMigrationAndStartApp',
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
          file: MAIN_THREAD,
          service: 'migrationOrchestrator',
          method: 'initMigrationAndStartApp',
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
      file: MAIN_THREAD,
      service: 'migrationOrchestrator',
      method: 'initMigrationAndStartApp',
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
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'initMigrationAndStartApp',
      },
      'Database migration child process spawned successfully by OS'
    );
  });

  dbMigrationProcess.on('disconnect', () => {
    logger.trace(
      {
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'initMigrationAndStartApp',
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
              file: MAIN_THREAD,
              service: 'migrationOrchestrator',
              method: 'initMigrationAndStartApp',
              meta: { message },
            },
            'Database migration child process is ready'
          );
          break;

        case 'notifyMigrationCompleted':
          migrationCompleted = true;

          logger.info(
            {
              file: MAIN_THREAD,
              service: 'migrationOrchestrator',
              method: 'initMigrationAndStartApp',
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
              file: MAIN_THREAD,
              service: 'migrationOrchestrator',
              method: 'initMigrationAndStartApp',
              meta: { message },
            },
            'Unknown message received from database migration child process'
          );
          break;
      }
    } catch (err) {
      logger.fatal(
        {
          file: MAIN_THREAD,
          service: 'migrationOrchestrator',
          method: 'initMigrationAndStartApp',
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
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'initMigrationAndStartApp',
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
          file: MAIN_THREAD,
          service: 'migrationOrchestrator',
          method: 'initMigrationAndStartApp',
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
    await import('../app.js');
  } catch (err) {
    logger.fatal(
      {
        file: MAIN_THREAD,
        service: 'migrationOrchestrator',
        method: 'startApp',
        meta: { err },
      },
      'Failed to start application after database migration completed'
    );

    await shutdownOrchestrator(1);
  }
}

async function waitForMigrationCompletion() {
  const subscriber = await getRedisSubscriber(MAIN_THREAD);

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
            file: MAIN_THREAD,
            service: 'migrationOrchestrator',
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
    MIGRATION_STATUS.COMPLETED,
    STATUS_TTL_SECONDS
  );
}
