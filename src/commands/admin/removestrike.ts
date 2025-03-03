import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import Strike from '../../models/Strike'; // Import the Strike model

export default class RemoveStrikeCommand extends Command {
    constructor() {
        super({
            name: 'removestrike',
            description: 'Remove a specified number of strikes from a staff member',
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
                    .setDescription('The staff member whose strikes will be removed')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('number')
                    .setDescription('Number of strikes to remove (1 or 2)')
                    .setRequired(true)
                    .addChoices(
                        { name: '1 Strike', value: 1 },
                        { name: '2 Strikes', value: 2 }
                    )
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const staffUser = interaction.options.getUser('staffuser', true);
            const numberToRemove = interaction.options.getInteger('number', true);

            // Find the user's strikes
            const existingStrikes = await Strike.findOne({ userId: staffUser.id });

            if (existingStrikes) {
                // Remove the specified number of strikes
                existingStrikes.count -= numberToRemove;
                if (existingStrikes.count < 0) existingStrikes.count = 0; // Ensure count doesn't go below 0
                await Strike.updateOne({ userId: staffUser.id }, { $set: existingStrikes });

                // Notify the user about the strike removal
                const removeEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('Strikes Removed')
                    .setDescription(`Removed ${numberToRemove} strike(s) from <@${staffUser.id}>.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [removeEmbed] });

                // Send a DM to the user notifying them of the strike removal
                const dmEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('Your Strikes Have Been Updated')
                    .setDescription(`Your strikes have been updated. You now have ${existingStrikes.count} strike(s).`)
                    .setTimestamp();

                await staffUser.send({ embeds: [dmEmbed] }).catch(err => {
                    logger.warn(`Could not send DM to <@${staffUser.id}>: ${err.message}`);
                });
            } else {
                await interaction.editReply(`❌ <@${staffUser.id}> has no strikes to remove.`);
            }
        } catch (error) {
            logger.error('Error in removestrike command:', error);
            await interaction.editReply('❌ An error occurred while removing strikes.');
        }
    }
} 