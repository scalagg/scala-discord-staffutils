import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import axios from 'axios';

export default class VPNCommand extends Command {
    constructor() {
        super({
            name: 'vpn',
            description: 'Manage VPN whitelist',
            category: 'Admin',
            roleIds: [
                '1338974800508485693',  // Owner role ID
                '1338974815255793718',  // Manager role ID
                '1339027310560546947',  // Developer role ID
                '1338974844187971614'  // HeadStaff role ID
            ],
            guildOnly: true
        });

        this.data
            .addSubcommand(subcommand =>
                subcommand
                    .setName('whitelist')
                    .setDescription('Add a player to VPN whitelist')
                    .addStringOption(option =>
                        option
                            .setName('player')
                            .setDescription('The player to whitelist')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unwhitelist')
                    .setDescription('Remove a player from VPN whitelist')
                    .addStringOption(option =>
                        option
                            .setName('player')
                            .setDescription('The player to remove from whitelist')
                            .setRequired(true)
                    )
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: ['Ephemeral'] });

            const config = interaction.client.config.apis.v4guard;
            const subcommand = interaction.options.getSubcommand();
            const player = interaction.options.getString('player', true);

            if (subcommand === 'whitelist') {
                const response = await this.whitelistPlayer(player, config);
                await interaction.editReply(this.formatResponse(response, 'whitelist'));
            } else if (subcommand === 'unwhitelist') {
                const response = await this.unwhitelistPlayer(player, config);
                await interaction.editReply(this.formatResponse(response, 'unwhitelist'));
            }

        } catch (error) {
            logger.error('Error in VPN command:', error);
            await interaction.editReply('❌ An error occurred while managing the VPN whitelist.');
        }
    }

    private async whitelistPlayer(player: string, config: any): Promise<any> {
        const response = await axios({
            method: 'PUT',
            url: `${config.baseUrl}/whitelist/${player}`,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'v4Guard API',
                'X-V4G-KEY': config.key
            }
        });
        return response.data;
    }

    private async unwhitelistPlayer(player: string, config: any): Promise<any> {
        const response = await axios({
            method: 'DELETE',
            url: `${config.baseUrl}/whitelist/${player}`,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'v4Guard API',
                'X-V4G-KEY': config.key
            }
        });
        return response.data;
    }

    private formatResponse(response: any, action: 'whitelist' | 'unwhitelist'): string {
        if (response.success) {
            const emoji = action === 'whitelist' ? '✅' : '🚫';
            return `${emoji} Successfully ${action === 'whitelist' ? 'added' : 'removed'} **${response.username}** ${action === 'whitelist' ? 'to' : 'from'} the VPN whitelist.`;
        } else {
            return `❌ Failed to ${action} player: ${response.message || 'Unknown error'}`;
        }
    }
} 