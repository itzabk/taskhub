import path from 'node:path';

import { db } from './mongoDb';

import { defaultRedisClient } from './redis';

import { asClass, asValue, createContainer, InjectionMode, Lifetime } from 'awilix';

import { logger } from '../helpers/pino/index.js';

const awilixOpts = {
  formatName: (name, descriptor) => {
    const cleanPath = path.normalize(descriptor.path);
    const splat = cleanPath.split(path.sep);
    const fileName = splat[splat.length - 1];
    const parentName = splat[splat.length - 2];
    const rootName = splat[splat.length - 3];
    const awilixInjectorName =
      parentName + rootName.charAt(0) + rootName.slice(1, splat.length - 1);
    return awilixInjectorName;
  },
  resolverOptions: {
    lifetime: Lifetime.SINGLETON,
    register: asClass,
  },
};

async function initAwilixContainer() {
  logger.trace(
    {
      file: 'mainThread',
      service: 'awilix',
      method: 'initAwilixContainer',
    },
    'Started initializing awilix container'
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
    });

    await container.loadModules(['../services/*/index.js', '../models/*/index.js'], awilixOpts);

    logger.info(
      {
        file: 'mainThread',
        service: 'awilix',
        method: 'initAwilixContainer',
      },
      'Awilix container created successfully'
    );

    return container;
  } catch (err) {
    logger.error(
      {
        file: 'mainThread',
        service: 'awilix',
        method: 'initAwilixContainer',
        meta: { err },
      },
      'Error occured during awilix container creation'
    );
    throw err;
  }
}

export const awilixContainer = await initAwilixContainer();
