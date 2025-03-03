import { ChatInputCommandInteraction, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import { HTTPUtil } from '../../utils/HTTPUtil.js';
import AnticheatLog from '../../models/AnticheatLog.ts';

type LogQuery = {
    playerName: string;
    date?: { $gte: Date };
};

export default class AnticheatLogsCommand extends Command {
    constructor() {
        super({
            name: 'logs',
            description: 'View anticheat logs for a player',
            category: 'Admin',
            permissions: [PermissionFlagsBits.Administrator],
            guildOnly: true
        });

        this.data
            .addStringOption(option =>
                option
                    .setName('player')
                    .setDescription('The player to check logs for')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('type')
                    .setDescription('Type of logs to view')
                    .addChoices(
                        { name: 'Total', value: 'total' },
                        { name: 'Session', value: 'session' }
                    )
                    .setRequired(false)
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const username = interaction.options.getString('player', true).toLowerCase();
            const type = interaction.options.getString('type') || 'total';
            
            await interaction.deferReply();
            await interaction.editReply({
                content: `🔍 Lumos Contacting the database...`
            });

            const result = await HTTPUtil.fetchLumosLogs(username, interaction.user.id);
            
            if (!result || !result.logs) {
                await interaction.editReply({
                    content: 'There was an error contacting the logs database.'
                });
                return;
            }

            if (result.logs.length === 0) {
                await interaction.editReply({
                    content: `${username} has no logs${type === 'session' ? ' this session' : ''}.`
                });
                return;
            }

            // Count violations by check type
            const checkCounts = new Map<string, number>();
            for (const log of result.logs) {
                const checkKey = `${log.checkName} ${log.checkType}`;
                const value = log.experimental ? 0.5 : 1.0;
                checkCounts.set(checkKey, (checkCounts.get(checkKey) || 0) + value);
            }

            const summaryMessage = [
                `Showing ${username}'s logs from ${type === 'total' ? 'all time' : 'this session'} (${result.logs.length} violations)`,
                '',
                ...Array.from(checkCounts.entries()).map(([check, count]) => 
                    `- ${check} (x${count})`
                ),
                '',
                result.pasteUrl ? `📋 Full logs: ${result.pasteUrl}` : '❌ Failed to create paste link'
            ].join('\n');

            await interaction.editReply({
                content: summaryMessage
            });

        } catch (error) {
            logger.error('Error in anticheat logs command:', error);
            await interaction.editReply({
                content: 'An error occurred while fetching the logs.'
            });
        }
    }
} 