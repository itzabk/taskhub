import { fork } from 'node:child_process';

import { existsSync } from 'node:fs';

import { logger } from '../pino/index.js';

const childProcessSet = new Set();

export function forkChild(path = '', args = [], options = {}) {
  if (!existsSync(path) || !path) {
    logger.error(
      {
        file: 'mainThread',
        service: 'helpers:utils',
        method: 'forkChild',
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
