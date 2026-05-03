import fs from 'node:fs';

import path from 'node:path';

import { logger } from './helpers/index.js';

import { LOGGER_FILES } from './constants/index.js';

import { initMigrationAndStartApp, shutdownOrchestrator } from './orchestrators/index.js';

const { MAIN_THREAD } = LOGGER_FILES;

const __dirname = import.meta.dirname;
const __rootDir = path.resolve(__dirname, '..');

const IS_WINDOWS = process.platform === 'win32';

// Signal handlers for graceful shutdown
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
      file: MAIN_THREAD,
      service: 'index',
      method: 'uncaughtException',
      meta: { err, pid: process.pid },
    },
    'Uncaught exception encountered in main process, initiating graceful shutdown'
  );

  await shutdownOrchestrator(1);
});

process.on('unhandledRejection', async err => {
  logger.fatal(
    {
      file: MAIN_THREAD,
      service: 'index',
      method: 'unhandledRejection',
      meta: { err, pid: process.pid },
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
      {
        file: MAIN_THREAD,
        service: 'index',
        method: 'SIGQUIT',
        meta: { reportPath, pid: process.pid },
      },
      'Diagnostic report generated successfully on SIGQUIT signal'
    );

    await shutdownOrchestrator(0);
  } catch (err) {
    logger.fatal(
      {
        file: MAIN_THREAD,
        service: 'index',
        method: 'SIGQUIT',
        meta: { err, pid: process.pid },
      },
      'Failed to generate diagnostic report on SIGQUIT signal'
    );

    process.exit(1);
  }
});

initMigrationAndStartApp();
