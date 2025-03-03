import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { logger } from './logger.js';
import type { Command } from '../structures/Command.js';

export async function deployCommands(commands: Command[], token: string, clientId: string, guildId?: string) {
    try {
        const rest = new REST().setToken(token);

        // Clear existing commands
        logger.info('Clearing existing commands...');
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            logger.success('Cleared guild commands');
        }
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        logger.success('Cleared global commands');

        // Deploy new commands
        const commandData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = commands.map(cmd => cmd.data.toJSON());
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        // For testing, deploy to specific guild first
        if (guildId) {
            logger.info(`Deploying commands to guild ${guildId}...`);
            const guildData = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commandData },
            );
            logger.success(`Successfully reloaded ${Array.isArray(guildData) ? guildData.length : 0} guild commands.`);
        }

        // Deploy globally
        logger.info('Deploying commands globally...');
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandData },
        );
        logger.success(`Successfully reloaded ${Array.isArray(data) ? data.length : 0} global commands.`);

    } catch (error: any) {
        logger.error('Error deploying commands:', error);
        // More detailed error information
        if (error.code === 10002) {
            logger.error('Invalid client ID or token. Please check your config.toml');
            logger.info('Make sure the client ID matches your Application ID from Discord Developer Portal');
        }
    }
} 