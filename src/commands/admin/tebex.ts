import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import axios from 'axios';

export default class TebexCommand extends Command {
    constructor() {
        super({
            name: 'tebex',
            description: 'Look up Tebex purchases',
            category: 'Admin',
            roleIds: [
                '1338974800508485693',  // Owner role ID
                '1338974815255793718',  // Manager role ID
                '1338974844187971614',  // HeadStaff role ID
                // Add other role IDs as needed
            ],
            guildOnly: true
        });

        this.data
            .addStringOption(option =>
                option
                    .setName('id')
                    .setDescription('The Tebex transaction ID to look up')
                    .setRequired(true)
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            // Check if the user has any of the required roles
            const hasRole = this.roleIds.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!hasRole) {
                await interaction.reply('❌ You do not have permission to use this command.');
                return;
            }

            await interaction.deferReply({ flags: ['Ephemeral'] });

            const config = interaction.client.config.apis.tebex;
            const transactionId = interaction.options.getString('id', true);
            const purchase = await this.lookupPurchase(transactionId, config);

            if (!purchase || !purchase.player) {
                await interaction.editReply('❌ No purchase found with that ID or the purchase data is incomplete.');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Purchase #${purchase.id}`)
                .setDescription(`Transaction by ${purchase.player.name}`)
                .addFields(
                    { name: 'Status', value: purchase.status, inline: true },
                    { name: 'Amount', value: `$${purchase.amount}`, inline: true },
                    { name: 'Date', value: new Date(purchase.date).toLocaleString(), inline: true },
                    {
                        name: 'Packages',
                        value: purchase.packages.map(pkg => 
                            `• ${pkg.name} (x${pkg.quantity})`
                        ).join('\n') || 'No packages'
                    }
                )
                .setFooter({ text: `Transaction ID: ${purchase.id}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in Tebex command:', error);
            await interaction.editReply('❌ An error occurred while looking up the purchase.');
        }
    }

    private async lookupPurchase(transactionId: string, config: any): Promise<any> {
        try {
            const headers = {
                'X-Tebex-Secret': "3eee1f39b737afb7441af8029b247258f0b34054"
            };

            const response = await axios({
                method: 'GET',
                url: `https://plugin.tebex.io/payments/${transactionId}`,
                headers: headers
            });

            return response.data;
        } catch (error) {
            logger.error('Error looking up Tebex purchase:', error);
            return null;
        }
    }
} 