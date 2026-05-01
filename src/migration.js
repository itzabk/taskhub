import { config, up } from 'migrate-mongo';

import migrateConfig from './configs/migrate-mongo-config.js';

import { db } from './singletons/mongoDb.js';

import { logger } from './helpers/pino/index.js';

import { shutdownOrchestrator } from './shutdownOrchestrator.js';

if (process.send) {
  process.send({ action: 'ready' });
}

const PLATFORM = process.platform;

async function runMigrations() {
  try {
    const start = process.hrtime.bigint();
    logger.trace(
      {
        file: 'migration',
        service: 'migration',
        method: 'runMigrations',
      },
      'Database migration process initiated'
    );

    config.set(migrateConfig);

    const dbConn = db.db; // actual MongoDB Db instance
    const client = db.getClient();

    const migratedFiles = await up(dbConn, client);

    if (migratedFiles.length > 0) {
      const end = process.hrtime.bigint();
      const durationMS = Number((end - start) / 1_000_000n);
      for (const fileName of migratedFiles) {
        logger.info(
          {
            service: 'runMigrations',
            file: 'migration',
            method: 'database.up',
            meta: { migrationFile: fileName },
            durationMS,
          },
          `Database migration file applied: ${fileName}`
        );
      }
    } else {
      const end = process.hrtime.bigint();
      const durationMS = Number((end - start) / 1_000_000n);
      logger.info(
        {
          service: 'runMigrations',
          file: 'migration',
          method: 'database.up',
          durationMS,
        },
        'Database schema is already up to date, no migrations needed'
      );
    }

    process.send({ action: 'notifyMigrationCompleted' });

    return true;
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMS = Number((end - start) / 1_000_000n);
    logger.error(
      {
        service: 'runMigrations',
        file: 'migration',
        method: 'database.up',
        durationMS,
        meta: { err },
      },
      'Database migration process failed with error'
    );

    process.send({
      action: 'notifyMigrationFailed',
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
    });
  }
}

process.on('message', async msg => {
  if (msg.action === 'shutdown') {
    await shutdownOrchestrator(0);
  }
});

function forceKill() {
  const timeout = setTimeout(() => {
    process.exit(1);
  }, 10_000);
  timeout.unref();
  logger.warn(
    {
      service: 'runMigrations',
      file: 'migration',
      method: 'database.up',
    },
    'Database migration process exited abruptly'
  );
}

process.on('exit', code => {
  if (code !== 0) {
    logger.error(
      {
        service: 'runMigrations',
        file: 'migration',
        method: 'database.up',
        meta: { code },
      },
      'Database migration process failed with exit'
    );
  }
});

process.on('disconnect', () => {
  logger.trace(
    {
      service: 'runMigrations',
      file: 'migration',
      method: 'database.up',
    },
    'Database migration IPC disconnected with parent'
  );
});

process.on('SIGINT', () => {
  forceKill();
});

process.on('SIGTERM', () => {
  forceKill();
});

process.on('SIGUSR2', () => {
  forceKill();
});

if (PLATFORM === 'win32') {
  process.on('SIGBREAK', () => {
    forceKill();
  });
}

await runMigrations();
