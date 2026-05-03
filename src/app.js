import Cluster from 'node:cluster';

import os from 'node:os';

import path from 'node:path';

import { serverConfigs } from './configs/serverConfigs.js';

import { logger } from './helpers/index.js';

const noOfCores = os.availableParallelism();

const { EXPRESS_WORKERS } = serverConfigs;

const __dirname = import.meta.dirname;

if (Cluster.isPrimary) {
  const workerCount = EXPRESS_WORKERS || noOfCores;

  Cluster.setupPrimary({
    exec: path.resolve(__dirname, 'express.js'),
  });

  Cluster.on('fork', worker => {
    logger.info(
      {
        file: 'expressWorker',
        service: 'cluster',
        method: 'fork',
        meta: {
          parentPid: process.pid,
          workerId: worker.id,
          workerPid: worker.process.pid,
        },
      },
      `Cluster worker process with pid ${worker.process.pid} forked successfully`
    );
  });

  Cluster.on('online', worker => {
    logger.info(
      {
        file: 'expressWorker',
        service: 'cluster',
        method: 'online',
        meta: {
          parentPid: process.pid,
          workerId: worker.id,
          workerPid: worker.process.pid,
        },
      },
      `Cluster worker process with pid ${worker.process.pid} is online and ready to accept requests`
    );
  });

  Cluster.on('listening', (worker, address) => {
    logger.info(
      {
        file: 'expressWorker',
        service: 'cluster',
        method: 'listening',
        meta: {
          parentPid: process.pid,
          workerId: worker.id,
          workerPid: worker.process.pid,
          address: address,
        },
      },
      'Cluster worker process listening on network'
    );
  });

  Cluster.on('exit', (worker, code, signal) => {
    logger.error(
      {
        file: 'expressWorker',
        service: 'cluster',
        method: 'exit',
        meta: {
          parentPid: process.pid,
          workerId: worker.id,
          workerPid: worker.process.pid,
          code,
          signal,
        },
      },
      'Cluster worker process exited unexpectedly, restarting worker'
    );

    Cluster.fork();
  });

  for (let i = 0; i < workerCount; i++) {
    Cluster.fork();
  }
}
