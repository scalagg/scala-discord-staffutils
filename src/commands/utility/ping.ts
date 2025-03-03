import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';

export default class PingCommand extends Command {
    constructor() {
        super({
            name: 'pingtest',
            description: 'Check bot latency',
            category: 'Utility'
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            logger.debug('Executing ping command');
            
            // Since we already deferred in the handler, use editReply
            const sent = await interaction.editReply({ content: 'Pinging...' });
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            
            await interaction.editReply({
                content: `Pong! 🏓\nBot Latency: ${latency}ms\nWebSocket Latency: ${interaction.client.ws.ping}ms`
            });
            
            logger.debug('Ping command completed successfully');
        } catch (error) {
            logger.error('Error in ping command:', error);
            throw error; // Let the interaction handler deal with it
        }
    }
} 