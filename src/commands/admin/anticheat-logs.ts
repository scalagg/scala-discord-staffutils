import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import { HTTPUtil } from '../../utils/HTTPUtil.js';

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
            roleIds: [
                '1338974800508485693',  // Owner role ID
                '1338974815255793718',  // Manager role ID
                '1339027310560546947',  // Developer role ID
                '1338974844187971614',  // HeadStaff role ID
                '1346151332658024478',  // AntiCheat Admin role ID
            ],
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
            await interaction.deferReply({ flags: ['Ephemeral'] });

            const username = interaction.options.getString('player', true).toLowerCase();
            const type = interaction.options.getString('type') || 'total';
            
            const config = interaction.client.config.apis.anticheat;
            const result = await HTTPUtil.fetchLumosLogs(username, interaction.user.id, config);
            
            if (!result) {
                await interaction.editReply('❌ Failed to fetch logs for that player.');
                return;
            }

            const { logs, pasteUrl } = result;

            if (!logs || logs.length === 0) {
                await interaction.editReply('❌ No logs found for that player.');
                return;
            }

            // Count violations by check type
            const checkCounts = new Map<string, number>();
            for (const log of logs) {
                const checkKey = `${log.checkName} ${log.checkType}`;
                const value = log.experimental ? 0.5 : 1.0;
                checkCounts.set(checkKey, (checkCounts.get(checkKey) || 0) + value);
            }

            const summaryMessage = [
                `Showing ${username}'s logs from ${type === 'total' ? 'all time' : 'this session'} (${logs.length} violations)`,
                '',
                ...Array.from(checkCounts.entries()).map(([check, count]) => 
                    `- ${check} (x${count})`
                ),
                '',
                pasteUrl ? `📋 Full logs (copy & paste the link): ${pasteUrl}` : '❌ Failed to create paste link'
            ].join('\n');

            await interaction.editReply({
                content: summaryMessage
            });

        } catch (error) {
            logger.error('Error in anticheat logs command:', error);
            
            // Only try to respond if we haven't already
            if (!interaction.replied) {
                try {
                    await interaction.reply({
                        content: '❌ An error occurred while fetching the logs.',
                        flags: ['Ephemeral']
                    });
                } catch (replyError) {
                    logger.error('Error sending error response:', replyError);
                }
            }
        }
    }
} 