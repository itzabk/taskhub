import { fork } from 'node:child_process';

import { existsSync } from 'node:fs';

import { LOGGER_FILES } from '../../constants/index.js';

import { logger } from '../pino/index.js';

const { MAIN_THREAD } = LOGGER_FILES;

const childProcessSet = new Set();

export function forkChild(path = '', args = [], options = {}) {
  if (!existsSync(path) || !path) {
    logger.error(
      {
        file: MAIN_THREAD,
        service: 'helpers:utils',
        method: 'forkChild',
        meta: { pid: process.pid },
      },
      'Child process initialization failed: invalid or missing file path'
    );
    throw new Error('Invalid path specified for forking child process');
  }
  const child = fork(path, args, options);
  childProcessSet.add(child);
  child.once('exit', () => {
    childProcessSet.delete(child);
  });
  return child;
}

export function getChildProcesses() {
  return Array.from(childProcessSet);
}
