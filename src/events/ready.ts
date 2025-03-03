import { Client, Events } from 'discord.js';
import { logger } from '../utils/logger.js';

export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        logger.success(`Ready! Logged in as ${client.user?.tag}`);
        // Add debug info about loaded commands
        logger.debug(`Loaded commands: ${Array.from(client.commands.keys()).join(', ')}`);
    }
} 