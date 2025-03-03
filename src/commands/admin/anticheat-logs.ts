import { ChatInputCommandInteraction, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import { HTTPUtil } from '../../utils/HTTPUtil.js';
import AnticheatLog from '../../models/AnticheatLog.js';

// Add this type at the top of the file
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

            // Fetch logs from Lumos API
            const lumosLogs = await HTTPUtil.fetchLumosLogs(username, interaction.user.id);
            
            if (!lumosLogs) {
                await interaction.editReply({
                    content: 'There was an error contacting the logs database.'
                });
                return;
            }

            if (!Array.isArray(lumosLogs) || lumosLogs.length === 0) {
                await interaction.editReply({
                    content: `${username} has no logs${type === 'session' ? ' this session' : ''}.`
                });
                return;
            }

            // Process logs
            const checkCounts = new Map<string, number>();
            let logBuilder = [
                `\nPaste generated for: ${username}`,
                `Requested at: ${new Date().toLocaleString()}`,
                `by ${interaction.user.tag} (${interaction.user.id})`,
                '',
                type === 'session' ? 'This is a Session Log so it will look differently to total logs\n' : '',
                ''
            ].join('\n');

            // Process each log
            for (const log of lumosLogs) {
                const checkKey = `${log.checkName} ${log.checkType}`;
                const value = log.experimental ? 0.5 : 1.0;
                checkCounts.set(checkKey, (checkCounts.get(checkKey) || 0) + value);

                const fixedData = log.checkData.replace(/\*\*\*\[EXTRA DEBUG\]\*\*\*\*(.*$)/, '');
                
                logBuilder += [
                    `\nCheck: ${log.checkName} (${log.checkType})`,
                    `Violation: ${log.violation}`,
                    `Experimental: ${log.experimental}`,
                    `CheckData: ${fixedData}`,
                    `EXTRA-DEBUG: ${log.extraDebug || 'null'}`,
                    '\n'
                ].join('\n');
            }

            // Create file attachment
            const attachment = new AttachmentBuilder(
                Buffer.from(logBuilder, 'utf-8'),
                { name: `anticheat-logs-${username}.log` }
            );

            // Send response with summary
            const summaryMessage = [
                `Showing ${username}'s logs from ${type === 'total' ? 'all the time' : 'this session'} (${lumosLogs.length})`,
                '',
                ...Array.from(checkCounts.entries()).map(([check, count]) => 
                    `- ${check} (x${count})`
                )
            ].join('\n');

            await interaction.editReply({
                content: summaryMessage,
                files: [attachment]
            });

        } catch (error) {
            logger.error('Error in anticheat logs command:', error);
            await interaction.editReply({
                content: 'An error occurred while fetching the logs.'
            });
        }
    }
} 