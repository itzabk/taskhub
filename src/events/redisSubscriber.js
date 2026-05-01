import { defaultRedisClient, duplicateRedisClient, getRedisClients } from '../singletons/redis.js';

export async function getRedisSubscriber(name) {
  const availableClients = getRedisClients();

  const foundClient = availableClients.find(entity => entity.type === name);

  if (foundClient) {
    return foundClient.client;
  }

  return await duplicateRedisClient(defaultRedisClient, name);
}
