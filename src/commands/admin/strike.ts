import { ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import Strike from '../../models/Strike';

export default class StrikeCommand extends Command {
    constructor() {
        super({
            name: 'strike',
            description: 'Issue a strike to a staff member',
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
                    .setDescription('The staff member to strike')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for the strike')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Disrespecting team members', value: 'disrespect' },
                        { name: 'Arguing against authority', value: 'arguing' },
                        { name: 'Being unprofessional in game', value: 'unprofessional_game' },
                        { name: 'Being unprofessional in Discord', value: 'unprofessional_discord' },
                        { name: 'Inactivity', value: 'inactivity' },
                        { name: 'Inappropriate language', value: 'language' },
                        { name: 'Leaking staff information', value: 'leaking' }
                    )
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: 64 });

            const staffUser = interaction.options.getUser('staffuser', true);
            const reason = interaction.options.getString('reason', true);

            // Check if the user already has strikes
            const existingStrikes = await Strike.findOne({ userId: staffUser.id });

            let updatedStrikesCount = 1; // Default to 1 for the first strike
            if (existingStrikes) {
                // Increment the strike count
                updatedStrikesCount = existingStrikes.count + 1;
                existingStrikes.reasons.push(reason);
                existingStrikes.count = updatedStrikesCount; // Update the count in the existing strikes object
                await Strike.updateOne({ userId: staffUser.id }, { $set: existingStrikes });
            } else {
                // Create a new entry for the user
                const newStrike = new Strike({
                    userId: staffUser.id,
                    count: 1,
                    reasons: [reason]
                });
                await newStrike.save();
            }

            // Notify the user about the strike
            const strikeEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Strike Issued')
                .setDescription(`You have received a strike for the following reason: **${reason}**`)
                .addFields(
                    { name: 'Total Strikes', value: `${updatedStrikesCount}`, inline: true }
                )
                .setTimestamp();

            await staffUser.send({ embeds: [strikeEmbed] }).catch(err => {
                logger.warn(`Could not send DM to <@${staffUser.id}>: ${err.message}`);
            });

            // Log the strike in the designated channel
            const logChannel = await interaction.guild?.channels.fetch('1346189938437128284');
            if (logChannel && logChannel.type === ChannelType.GuildText) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#ffcc00')
                    .setTitle('Strike Logged')
                    .setDescription(`Staff member <@${staffUser.id}> has been issued a strike.`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Total Strikes', value: `${updatedStrikesCount}`, inline: true },
                        { name: 'Issued By', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

            // Check if the user has reached 3 strikes
            if (updatedStrikesCount >= 3) {
                // Attempt to demote and kick the user
                const guild = interaction.guild;
                const member = await guild.members.fetch(staffUser.id);
                if (member) {
                    try {
                        await member.kick('Demoted due to 3 strikes');

                        // Log the kick in the changelog channel
                        const changelogChannel = await interaction.guild?.channels.fetch('1338011148775325770'); 
                        if (changelogChannel && changelogChannel.type === ChannelType.GuildText) {
                            const kickEmbed = new EmbedBuilder()
                                .setColor('#ff0000')
                                .setTitle('Staff Member Demoted and Kicked')
                                .setDescription(`Staff member <@${staffUser.id}> has been demoted and kicked for reaching 3 strikes.`)
                                .setTimestamp();

                            await changelogChannel.send({ embeds: [kickEmbed] });
                        }

                        // Reset the user's strikes in the database
                        await Strike.deleteOne({ userId: staffUser.id });

                        // Notify the user about their demotion
                        const demotionEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('You Have Been Demoted')
                            .setDescription(`You have been demoted from the team due to receiving 3 strikes.`)
                            .setTimestamp();

                        await staffUser.send({ embeds: [demotionEmbed] }).catch(err => {
                            logger.warn(`Could not send DM to <@${staffUser.id}>: ${err.message}`);
                        });

                        await interaction.editReply(`✅ <@${staffUser.id}> has been kicked for receiving 3 strikes.`);
                    } catch (kickError) {
                        logger.error('Error kicking user:', kickError);
                        await interaction.editReply(`⚠️ Unable to kick <@${staffUser.id}> due to insufficient permissions.`);
                    }
                }
            } else {
                await interaction.editReply(`✅ Strike issued to <@${staffUser.id}>. Total strikes: ${updatedStrikesCount}`);
            }
        } catch (error) {
            logger.error('Error in strike command:', error);
            await interaction.editReply('❌ An error occurred while issuing the strike.');
        }
    }
} 