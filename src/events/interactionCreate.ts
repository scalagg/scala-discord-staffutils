import { Events, Interaction } from 'discord.js';
import { Command } from '../structures/Command.js';
import { logger } from '../utils/logger.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        // Add debug logging
        logger.debug(`Received interaction: ${interaction.type} - ${interaction.id}`);
        
        if (!interaction.isChatInputCommand()) {
            logger.debug('Not a chat input command, ignoring');
            return;
        }

        logger.debug(`Processing command: ${interaction.commandName}`);

        try {
            const command = interaction.client.commands.get(interaction.commandName) as Command;

            if (!command) {
                logger.error(`No command matching ${interaction.commandName} was found.`);
                await interaction.reply({ 
                    content: 'Command not found!', 
                    ephemeral: true 
                });
                return;
            }

            logger.debug(`Found command: ${command.name} in category: ${command.category}`);

            // Check if command is guild-only
            if (command.guildOnly && !interaction.guild) {
                logger.debug('Guild-only command used in DM');
                await interaction.reply({ 
                    content: 'This command can only be used in a server!', 
                    ephemeral: true 
                });
                return;
            }

            // Check role IDs if needed
            if (command.roleIds && command.roleIds.length > 0) {
                const hasRole = command.roleIds.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!hasRole) {
                    logger.debug(`User lacks roles: ${command.roleIds.join(', ')}`);
                    await interaction.reply({ 
                        content: 'You do not have permission to use this command!', 
                        ephemeral: true 
                    });
                    return;
                }
            }

            logger.debug(`Executing command: ${command.name}`);
            
            // Execute the command without deferring
            await command.execute(interaction);
            logger.debug(`Command ${command.name} executed successfully`);
            
        } catch (error) {
            logger.error('Command execution error', error);
            logger.debug(`Error stack trace: ${error?.stack}`);
            
            const reply = {
                content: 'There was an error executing this command!',
                ephemeral: true
            };
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            } catch (followUpError) {
                logger.error('Error sending error message to user', followUpError);
            }
        }
    }
} 