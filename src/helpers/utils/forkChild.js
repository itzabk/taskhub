import { fork } from 'node:child_process';

import { existsSync } from 'node:fs';

import Logger from '../pino';

const childProcessSet = new Set();

const logger = new Logger();

export function forkChild(path = '', args = [], options = {}) {
  if (!existsSync(path) || !path) {
    logger.error(
      {
        file: 'mainThread',
        service: 'helpers:utils',
        method: 'forkChild',
      },
      'Invalid path specified for forking child process'
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
