import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { connect as mongoConnect } from 'mongoose';
import { createClient } from 'redis';
import { loadCommands } from './handlers/commandHandler';
import { loadEvents } from './handlers/eventHandler';
import { loadConfig } from './utils/configLoader';
import { logger } from './utils/logger';
import type { BotConfig } from './structures/Config';
import memberEventsListener from './listeners/memberEvents.js'; // Import the member events listener
import staffLeaveListener from './listeners/staffLeaveListener.js'; // Import the staff leave listener

logger.divider();
logger.startup('Discord Bot Starting...');
logger.divider();

// Load configuration
logger.info('Loading configuration...');
const config: BotConfig = loadConfig();
logger.success('Configuration loaded successfully');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Extend client to store commands and config
declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
        config: BotConfig;
    }
}

client.commands = new Collection();
client.config = config;

// Database connections
async function connectToDatabase() {
    logger.database('Connecting to databases...');
    
    try {
        // Connect to MongoDB
        await mongoConnect(config.database.mongodb.uri);
        logger.success('Connected to MongoDB');

        // Connect to Redis
        const redisClient = createClient({
            url: config.database.redis.uri
        });

        redisClient.on('error', (error) => {
            logger.error('Redis Error', error);
            process.exit(1);
        });

        await redisClient.connect();
        logger.success('Connected to Redis');

        // Make redis client global
        global.redisClient = redisClient;
    } catch (error) {
        logger.error('Database connection error', error);
        process.exit(1);
    }
}

// Initialize bot
async function initialize() {
    try {
        await connectToDatabase();

        logger.command('Loading commands...');
        await loadCommands(client);
        logger.success('Commands loaded successfully');

        logger.event('Loading events...');
        await loadEvents(client);
        logger.success('Events loaded successfully');

        logger.info('Logging in to Discord...');
        await client.login(config.bot.token);

        // Register the listeners
        try {
            logger.info('Loading member events listener...');
            memberEventsListener(client); 
            logger.success('Member events listener loaded successfully.');
        } catch (error) {
            logger.error('Error loading member events listener:', error);
        }

        try {
            logger.info('Loading staff leave listener...');
            staffLeaveListener(client); // Register the staff leave listener
            logger.success('Staff leave listener loaded successfully.');
        } catch (error) {
            logger.error('Error loading staff leave listener:', error);
        }
    } catch (error) {
        logger.error('Initialization error', error);
        process.exit(1);
    }
}

initialize();

// Handle errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection', error);
});

process.on('SIGINT', async () => {
    logger.warning('Shutting down...');
    await global.redisClient?.quit();
    process.exit(0);
});