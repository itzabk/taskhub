import fs from 'node:fs';

import path from 'node:path';

import { serverConfigs } from './configs/serverConfigs.js';

import Logger from './helpers/pino/index.js';

import { forkChild } from './helpers/utils/forkChild.js';

import { shutdownOrchestrator } from './shutdownOrchestrator.js';

const __dirname = import.meta.dirname;

const __rootDir = path.resolve(__dirname, '..');

const IS_WINDOWS = process.platform === 'win32';

const { NODE_ENV } = serverConfigs;

// Development (src) vs Production (build)
const migrationPath =
  NODE_ENV === 'production'
    ? path.join(__rootDir, 'build/migration.js')
    : path.join(__rootDir, 'src/migration.js');

const logger = new Logger();

const dbMigrationProcess = forkChild(migrationPath);

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
