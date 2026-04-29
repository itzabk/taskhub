import { config, database } from 'migrate-mongo';

import { config as migrateConfig } from './configs/migrate-mongo-config';

import Logger from './helpers/pino';

import { db } from './singletons/mongoDb';

const logger = new Logger();

async function runMigrations() {
  try {
    logger.trace(
      {
        file: 'migration',
        service: 'migration',
        method: 'runMigrations',
      },
      'Migration process started'
    );

    config.set(migrateConfig);

    const dbConn = db.db; // actual MongoDB Db instance
    const client = db.getClient();

    const migratedFiles = await database.up(dbConn, client);

    if (migratedFiles.length > 0) {
      for (const fileName of migratedFiles) {
        logger.info(
          {
            service: 'migration',
            file: 'runMigrations',
            method: 'database.up',
            meta: { migrationFile: fileName },
          },
          `Applied: ${fileName}`
        );
      }
    } else {
      logger.info(
        {
          service: 'migration',
          file: 'runMigrations',
          method: 'database.up',
        },
        'Database is up to date.'
      );
    }

    process.send({ action: 'notifyMigrationCompleted' });

    return true;
  } catch (err) {
    logger.error(
      {
        service: 'migration',
        file: 'runMigrations',
        method: 'database.up',
        meta: { err },
      },
      'FATAL: Migration failed.'
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
