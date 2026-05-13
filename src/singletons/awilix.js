import path from 'node:path';

import { db } from './mongoDb.js';

import { defaultRedisClient } from './redis.js';

import { asClass, asValue, createContainer, InjectionMode, Lifetime } from 'awilix';

import { LOGGER_FILES } from '../constants/index.js';

import { logger } from '../helpers/index.js';

const { MAIN_THREAD } = LOGGER_FILES;

import { redisPublisher } from '../events/redisPublisher.js';

const awilixOpts = {
  formatName: (name, descriptor) => {
    const cleanPath = path.normalize(descriptor.path);
    const splat = cleanPath.split(path.sep);
    const parentName = splat[splat.length - 2];
    const rootName = splat[splat.length - 3];
    const suffix = rootName === 'services' ? 'Service' : rootName === 'models' ? 'Model' : '';
    return parentName + suffix;
  },
  resolverOptions: {
    lifetime: Lifetime.SINGLETON,
    register: asClass,
  },
  esModules: true,
};

async function initAwilixContainer() {
  logger.trace(
    {
      file: MAIN_THREAD,
      service: 'awilix',
      method: 'initAwilixContainer',
      meta: { pid: process.pid },
    },
    'Initializing dependency injection container'
  );
  try {
    const container = createContainer({
      strict: true,
      injectionMode: InjectionMode.PROXY,
    });

    container.register({
      mongooseConnection: asValue(db),
      redisConnection: asValue(defaultRedisClient),
      logger: asValue(logger),
      redisPublisher: asValue(redisPublisher),
    });

    await container.loadModules(['src/services/*/index.js', 'src/models/*/index.js'], awilixOpts);

    logger.info(
      {
        file: MAIN_THREAD,
        service: 'awilix',
        method: 'initAwilixContainer',
        meta: { pid: process.pid },
      },
      'Dependency injection container initialized successfully'
    );

    return container;
  } catch (err) {
    logger.error(
      {
        file: MAIN_THREAD,
        service: 'awilix',
        method: 'initAwilixContainer',
        meta: { err, pid: process.pid },
      },
      'Failed to initialize dependency injection container'
    );
    throw err;
  }
}

export const awilixContainer = await initAwilixContainer();
