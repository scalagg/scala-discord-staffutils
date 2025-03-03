import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import Strike from '../../models/Strike'; // Import the Strike model

export default class MyStrikesCommand extends Command {
    constructor() {
        super({
            name: 'mystrikes',
            description: 'View your own strikes',
            category: 'General',
            guildOnly: true,
            roleIds: [
                '1338974800508485693',  // Owner role ID
                '1338974815255793718',  // Manager role ID
                '1339027310560546947',  // Developer role ID
                '1338974844187971614',  // HeadStaff role ID
                '1338974929798041600'
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const userId = interaction.user.id;

            // Find the user's strikes
            const existingStrikes = await Strike.findOne({ userId });

            if (existingStrikes) {
                const strikesEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`Your Strikes`)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                // Format the strikes and reasons
                const strikeFields = existingStrikes.reasons.map((reason, index) => ({
                    name: `Strike ${index + 1}`,
                    value: `Reason: ${reason}`,
                    inline: false
                }));

                strikesEmbed
                    .addFields(
                        { name: 'Total Strikes', value: `${existingStrikes.count}`, inline: true },
                        ...strikeFields // Spread the strike fields into the embed
                    )
                    .setFooter({ text: 'Keep up the good work!' });

                await interaction.editReply({ embeds: [strikesEmbed] });
            } else {
                await interaction.editReply(`❌ You have no strikes recorded.`);
            }
        } catch (error) {
            logger.error('Error in mystrikes command:', error);
            await interaction.editReply('❌ An error occurred while retrieving your strikes.');
        }
    }
} 