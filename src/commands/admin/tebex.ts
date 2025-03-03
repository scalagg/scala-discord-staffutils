import { ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import axios from 'axios';

export default class TebexCommand extends Command {
    constructor() {
        super({
            name: 'tebex',
            description: 'Look up Tebex purchases',
            category: 'Admin',
            permissions: [PermissionFlagsBits.Administrator],
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
            await interaction.deferReply({ flags: ['Ephemeral'] });

            logger.debug('Config:', interaction.client.config);

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
            // logger.debug('Tebex API Key:', config.apis.tebex);

            const headers = {
                'X-Tebex-Secret': "3eee1f39b737afb7441af8029b247258f0b34054"
            };

            logger.debug('Tebex API Request Headers:', headers);

            const response = await axios({
                method: 'GET',
                url: `https://plugin.tebex.io/payments/${transactionId}`,
                headers: headers
            });

            logger.debug('Tebex API Response:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error looking up Tebex purchase:', error);
            return null;
        }
    }
} 