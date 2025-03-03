import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import Strike from '../../models/Strike'; // Import the Strike model

export default class ViewStrikesCommand extends Command {
    constructor() {
        super({
            name: 'viewstrikes',
            description: 'View the strikes of a staff member',
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
                    .setDescription('The staff member whose strikes you want to view')
                    .setRequired(true)
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const staffUser = interaction.options.getUser('staffuser', true);

            // Find the user's strikes
            const existingStrikes = await Strike.findOne({ userId: staffUser.id });

            if (existingStrikes) {
                const strikesPerPage = 2; // Number of strikes to display per page
                const totalPages = Math.ceil(existingStrikes.reasons.length / strikesPerPage);
                let currentPage = 0;

                const createEmbed = (page: number) => {
                    const strikesEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle(`Strikes for ${staffUser.username}#${staffUser.discriminator}`)
                        .setThumbnail(staffUser.displayAvatarURL()) // Add user's avatar
                        .setTimestamp();

                    const start = page * strikesPerPage;
                    const end = start + strikesPerPage;
                    const strikesToShow = existingStrikes.reasons.slice(start, end);

                    strikesEmbed.addFields(
                        { name: 'Total Strikes', value: `${existingStrikes.count}`, inline: true },
                        ...strikesToShow.map((reason, index) => ({
                            name: `Strike ${start + index + 1}`,
                            value: `Reason: ${reason}`,
                            inline: false
                        }))
                    );

                    strikesEmbed.setFooter({ text: `Page ${page + 1} of ${totalPages}` });
                    return strikesEmbed;
                };

                const updateMessage = async () => {
                    const embed = createEmbed(currentPage);
                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 0), // Disable if on the first page
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage >= totalPages - 1) // Disable if on the last page
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                };

                await updateMessage();

                const filter = (i) => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async (i) => {
                    if (i.customId === 'prev') {
                        currentPage--;
                    } else if (i.customId === 'next') {
                        currentPage++;
                    }
                    await updateMessage();
                    await i.deferUpdate(); // Acknowledge the button press
                });

                collector.on('end', () => {
                    interaction.editReply({ components: [] }); // Disable buttons after timeout
                });
            } else {
                await interaction.editReply(`❌ <@${staffUser.id}> has no strikes recorded.`);
            }
        } catch (error) {
            logger.error('Error in viewstrikes command:', error);
            await interaction.editReply('❌ An error occurred while retrieving strikes.');
        }
    }
}