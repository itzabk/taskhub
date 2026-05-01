export const REDIS_KEYS = Object.freeze({
  migrationLock: 'migration:lock',
  migrationStatus: 'migration:status',
});

export const REDIS_TOPICS = Object.freeze({
  migration: 'migration:events',
});
