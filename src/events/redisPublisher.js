import CONSTANTS from '../constants/index.js';

import { defaultRedisClient } from '../singletons/redis.js';

import { logger } from '../helpers/pino/index.js';

export class RedisPublisher {
  constructor(redisInstance) {
    this.redisInstance = redisInstance;
    this.allowedChannels = new Set(Object.values(CONSTANTS.REDIS_TOPICS));
  }

  assert(channel, message) {
    if (!channel || !this.allowedChannels.has(channel)) {
      throw new Error(`Invalid Redis channel: ${channel}`);
    }

    if (!message) {
      throw new Error('Message is required for publishing');
    }
  }

  async publish(channel, message) {
    this.assert(channel, message);

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    const pubCount = await this.redisInstance.publish(channel, payload);

    if (pubCount === 0) {
      logger.warn(
        {
          file: 'redisPubSub',
          method: 'publish',
          service: 'redisPublisher',
          meta: {
            channel,
            payload,
          },
        },
        `Channel ${channel} has no subscribers`
      );
    } else {
      logger.trace(
        {
          file: 'redisPubSub',
          method: 'publish',
          service: 'redisPublisher',
          meta: {
            channel,
            payload,
          },
        },
        `Published payload to channel ${channel} successfully for ${pubCount} subscribers`
      );
    }
    return pubCount;
  }
}

export const redisPublisher = new RedisPublisher(defaultRedisClient);
