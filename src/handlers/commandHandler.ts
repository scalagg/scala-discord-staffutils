import { Client, ChatInputCommandInteraction } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Command } from '../structures/Command.js';
import { logger } from '../utils/logger.js';
import { deployCommands } from '../utils/deployCommands.js';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function loadCommands(client: Client) {
    const commands: Command[] = [];
    const commandsPath = join(__dirname, '..', 'commands');
    const commandFiles = readdirSync(commandsPath);

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        
        if (statSync(filePath).isDirectory()) {
            const categoryFiles = readdirSync(filePath).filter(file => file.endsWith('.ts'));
            
            for (const categoryFile of categoryFiles) {
                const command = await loadCommandFile(join(filePath, categoryFile), client);
                if (command) commands.push(command);
            }
        } else if (file.endsWith('.ts')) {
            const command = await loadCommandFile(filePath, client);
            if (command) commands.push(command);
        }
    }

    // Deploy slash commands
    if (commands.length > 0) {
        const testGuildId = "1337999031053320273"; // Add your test server ID here
        await deployCommands(
            commands,
            client.config.bot.token,
            client.config.bot.clientId,
            testGuildId // Pass test guild ID for faster testing
        );
    }
}

async function loadCommandFile(filePath: string, client: Client): Promise<Command | null> {
    try {
        const commandModule = await import(filePath);
        const command: Command = new commandModule.default();

        if (command instanceof Command) {
            client.commands.set(command.name, command);
            logger.command(`Loaded command: ${command.name}`);
            logger.debug(`Command structure: ${JSON.stringify({
                name: command.name,
                description: command.description,
                options: command.data.options,
                category: command.category
            }, null, 2)}`);
            return command;
        }
    } catch (error) {
        logger.error(`Error loading command from ${filePath}`, error);
    }
    return null;
}

export async function handleCommand(interaction: ChatInputCommandInteraction) {
    try {
        logger.debug(`Processing command: ${interaction.commandName}`);
        
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
            logger.error(`Command not found: ${interaction.commandName}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Command not found.', 
                    ephemeral: true 
                });
            }
            return;
        }

        logger.debug(`Found command: ${command.name} in category: ${command.category}`);
        
        // Check permissions if needed
        if (command.permissions && command.permissions.length > 0) {
            if (!interaction.memberPermissions?.has(command.permissions)) {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ You do not have permission to use this command.', 
                        ephemeral: true 
                    });
                }
                return;
            }
        }

        logger.debug(`Executing command: ${command.name}`);
        
        // Execute the command
        await command.execute(interaction);

    } catch (error) {
        logger.error('Error in command handler:', error);
        
        try {
            // Handle the error response
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ An error occurred while executing the command.', 
                    ephemeral: true 
                });
            } else if (interaction.deferred) {
                await interaction.editReply({ 
                    content: '❌ An error occurred while executing the command.' 
                });
            }
        } catch (followUpError) {
            logger.error('Error sending error message to user:', followUpError);
        }
    }
} 