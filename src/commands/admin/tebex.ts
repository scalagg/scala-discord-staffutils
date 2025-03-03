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

            const config = interaction.client.config.apis.tebex;
            const transactionId = interaction.options.getString('id', true);
            const purchase = await this.lookupPurchase(transactionId, config);

            if (!purchase) {
                await interaction.editReply('❌ No purchase found with that ID.');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Purchase #${purchase.transaction_id}`)
                .setDescription(`Transaction by ${purchase.customer.username}`)
                .addFields(
                    { name: 'Status', value: purchase.status.description, inline: true },
                    { name: 'Amount', value: `$${purchase.price.amount}`, inline: true },
                    { name: 'Date', value: new Date(purchase.created_at).toLocaleString(), inline: true },
                    {
                        name: 'Products',
                        value: purchase.products.map(product => 
                            `• ${product.name} (x${product.quantity})`
                        ).join('\n') || 'No products'
                    }
                )
                .setFooter({ text: `Transaction ID: ${purchase.transaction_id}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.error('Error in Tebex command:', error);
            await interaction.editReply('❌ An error occurred while looking up the purchase.');
        }
    }

    private async lookupPurchase(transactionId: string, config: any): Promise<any> {
        try {
            const response = await axios({
                method: 'GET',
                url: `https://checkout.tebex.io/api/payments/${transactionId}?type=txn_id`,
                headers: {
                    'X-Tebex-Secret': config.apis.tebex
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Error looking up Tebex purchase:', error);
            return null;
        }
    }
} 