import * as TOML from '@iarna/toml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import type { BotConfig } from '../structures/Config';

export function loadConfig(): BotConfig {
    const configPath = join(process.cwd(), 'config.toml');

    // Check if config file exists
    if (!existsSync(configPath)) {
        logger.error('config.toml not found!');
        logger.info('Please create a config.toml file in the root directory.');
        logger.info('Example config structure:');
        console.log(`
[bot]
token = "your-discord-bot-token"
clientId = "your-client-id"

[database]
  [database.mongodb]
  uri = "mongodb://localhost:27017/your_database"

  [database.redis]
  uri = "redis://localhost:6379"

[api]
weather = "your-weather-api-key"
`);
        process.exit(1);
    }

    try {
        const configFile = readFileSync(configPath, 'utf-8');
        const config = TOML.parse(configFile) as BotConfig;
        
        // Validate required fields with detailed errors
        const requiredFields = [
            ['bot.token', config.bot?.token],
            ['bot.clientId', config.bot?.clientId],
            ['database.mongodb.uri', config.database?.mongodb?.uri],
            ['database.redis.uri', config.database?.redis?.uri]
        ];

        const missingFields = requiredFields
            .filter(([_, value]) => !value)
            .map(([field]) => field);

        if (missingFields.length > 0) {
            logger.error('Missing required configuration fields:');
            missingFields.forEach(field => {
                logger.error(`Missing: ${field}`);
            });
            process.exit(1);
        }

        // Basic token format validation (just check if it's a non-empty string with reasonable length)
        if (typeof config.bot.token !== 'string' || config.bot.token.length < 50) {
            logger.error('Discord bot token seems invalid (too short)');
            process.exit(1);
        }

        // Validate client ID format
        if (!/^\d{17,19}$/.test(config.bot.clientId)) {
            logger.error('Invalid Discord client ID format');
            process.exit(1);
        }

        // Validate MongoDB URI format
        if (!config.database.mongodb.uri.startsWith('mongodb://') && 
            !config.database.mongodb.uri.startsWith('mongodb+srv://')) {
            logger.error('Invalid MongoDB URI format');
            process.exit(1);
        }

        // Validate Redis URI format
        if (!config.database.redis.uri.startsWith('redis://') && 
            !config.database.redis.uri.startsWith('rediss://')) {
            logger.error('Invalid Redis URI format');
            process.exit(1);
        }

        return config;
    } catch (error) {
        logger.error('Error loading config', error);
        process.exit(1);
    }
} 