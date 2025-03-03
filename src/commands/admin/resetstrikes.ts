import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import Strike from '../../models/Strike'; // Import the Strike model

export default class ResetStrikesCommand extends Command {
    constructor() {
        super({
            name: 'resetstrikes',
            description: 'Reset a staff member\'s strikes to zero',
            category: 'Admin',
            roleIds: [
                '1338974800508485693',  // Owner role ID
                '1338974815255793718',  // Manager role ID
            ],
            guildOnly: true
        });

        this.data
            .addUserOption(option =>
                option
                    .setName('staffuser')
                    .setDescription('The staff member whose strikes will be reset')
                    .setRequired(true)
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const staffUser = interaction.options.getUser('staffuser', true);

            // Reset the user's strikes in the database
            await Strike.deleteOne({ userId: staffUser.id });

            // Notify the user about the reset
            const resetEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Strikes Reset')
                .setDescription(`All strikes for <@${staffUser.id}> have been reset to zero.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [resetEmbed] });
        } catch (error) {
            logger.error('Error in resetstrikes command:', error);
            await interaction.editReply('❌ An error occurred while resetting strikes.');
        }
    }
} 