import { RedisClient } from 'redis'; // Adjust based on your Redis client

const redisClient = new RedisClient();

export async function getMinecraftUser(username: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        redisClient.exists(username, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply === 1); // 1 means the key exists
            }
        });
    });
} 