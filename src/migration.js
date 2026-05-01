import { config, up } from 'migrate-mongo';

import migrateConfig from './configs/migrate-mongo-config.js';

import { db } from './singletons/mongoDb.js';

import { logger } from './helpers/pino/index.js';

process.send({ action: 'ready' });

async function runMigrations() {
  try {
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
      for (const fileName of migratedFiles) {
        logger.info(
          {
            service: 'runMigrations',
            file: 'migration',
            method: 'database.up',
            meta: { migrationFile: fileName },
          },
          `Database migration file applied: ${fileName}`
        );
      }
    } else {
      logger.info(
        {
          service: 'runMigrations',
          file: 'migration',
          method: 'database.up',
        },
        'Database schema is already up to date, no migrations needed'
      );
    }

    process.send({ action: 'notifyMigrationCompleted' });

    return true;
  } catch (err) {
    logger.error(
      {
        service: 'runMigrations',
        file: 'migration',
        method: 'database.up',
        meta: { err },
      },
      'Database migration process failed with error'
    );

    throw err;
  }
}

process.on('message', async msg => {
  if (msg.action === 'shutdown') {
    await db.close();
    process.exit(0);
  }
});

await runMigrations();
