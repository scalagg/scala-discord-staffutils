import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { logger } from './logger.js';
import type { Command } from '../structures/Command.js';

export async function deployCommands(commands: Command[], token: string, clientId: string, guildId: string) {
    const rest = new REST({ version: '9' }).setToken(token);

    try {
        logger.debug('Started refreshing application (/) commands.');

        // Prepare command data for deployment
        const commandData = commands.map(command => command.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commandData },
        );

        logger.debug('Successfully reloaded application (/) commands.');
    } catch (error) {
        logger.error('Error deploying commands:', error);
    }
} 