import { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';

declare global {
    var redisClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
}

export {}; 