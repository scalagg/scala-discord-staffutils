import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import { getMinecraftSkin } from '../../utils/skinAPI.js';
import { getCollection } from '../../utils/mongo.js'; 

export default class DemoteCommand extends Command {
    constructor() {
        super({
            name: 'demote',
            description: 'Demote a user from the staff team',
            category: 'Staff Management',
            roleIds: [
                '1338974800508485693',  // Owner role ID
                '1338974815255793718',  // Manager role ID
                '1338999880340869320',  // STM role ID
            ],
            guildOnly: true
        });

        this.data
            .addUserOption(option =>
                option
                    .setName('discorduser')
                    .setDescription('The Discord user to demote')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('minecraftuser')
                    .setDescription('The Minecraft username of the user')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('The reason for the demotion')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Inactivity', value: 'Inactivity' },
                        { name: 'Immaturity', value: 'Immaturity' },
                        { name: 'Abuse of Permissions', value: 'Abuse of Permissions' },
                        { name: 'Max Strikes Reached', value: 'Max Strikes Reached' },
                        { name: 'Confidentiality Breach', value: 'Confidentiality Breach' },
                        { name: 'Failure to Follow Guidelines', value: 'Failure to Follow Guidelines' },
                        { name: 'Staffing on Multiple Networks', value: 'Staffing on Multiple Networks' },
                        { name: 'Blacklisted from the Staff Team', value: 'Blacklisted from the Staff Team' },
                        { name: 'Custom Reason', value: 'Custom' }
                    )
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: ['Ephemeral'] });

            const discordUser = interaction.options.getUser('discorduser', true);
            const minecraftUser = interaction.options.getString('minecraftuser', true); // Get the Minecraft username
            const reason = interaction.options.getString('reason', true);

            // If the reason is "Custom", prompt the user for a custom reason
            let finalReason = reason;
            if (reason === 'Custom') {
                // Send a follow-up message to ask for a custom reason
                await interaction.editReply(`Please provide a custom reason for the demotion of <@${discordUser.id}>.`);
                
                // Wait for the user's response (this part requires a different approach, such as a message collector)
                const filter = (response) => {
                    return response.author.id === interaction.user.id; // Ensure the response is from the command issuer
                };

                const collected = await interaction.channel?.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
                if (collected) {
                    finalReason = collected.first()?.content || 'No reason provided.';
                } else {
                    await interaction.followUp('❌ You did not provide a reason in time. The demotion has been canceled.');
                    return;
                }
            }

            // Fetch the Minecraft skin using the provided Minecraft username
            const skinUrl = await getMinecraftSkin(minecraftUser);
            if (!skinUrl) {
                await interaction.editReply(`❌ Minecraft user "${minecraftUser}" not found.`);
                return;
            }

            // Fetch the staff role from MongoDB
            const collection = await getCollection('Rank'); 
            const staffRole = await collection.findOne({ discordId: discordUser.id });
            const staffRoleName = staffRole ? staffRole.roleName : 'Unknown Role';

            // Prepare the demotion message
            const demotionMessage = `
Hey ${discordUser.username},

After reviewing your performance as ${staffRoleName}, we've decided that it's best to adjust your position. ${finalReason}. As a staff member, there are expectations to uphold, and unfortunately, ${finalReason} has made it difficult for you to fulfill your role effectively.

Because of this, we'll be removing your ${staffRoleName} position. This isn't personal, and you're still welcome to stay as a player if you'd like. If you ever feel like you're in a better position to contribute actively and meet expectations, you're welcome to reapply in the future after 1 month.

Please reach out to a Staff Leader if you would like to discuss this.

— <@${interaction.user.id}>
Staff Management @ Scala Studios
`;

            // Send the demotion message to the user
            await discordUser.send(demotionMessage);

            // Attempt to kick the user from the server with the formatted reason
            const kickReason = `Demotion [${finalReason}] | Issuer: <@${interaction.user.id}>`;
            const member = await interaction.guild?.members.fetch(discordUser.id);
            if (member) {
                try {
                    await member.kick(kickReason);
                } catch (error) {
                    logger.error('Failed to kick user:', error);
                    await interaction.followUp(`⚠️ Unable to kick <@${discordUser.id}> due to permission issues. Proceeding with the demotion process.`);
                }
            }

            // Send message to changelog channel
            const changelogChannel = await interaction.guild?.channels.fetch('1345879847783633069');
            if (changelogChannel && changelogChannel instanceof TextChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('User Demoted')
                    .setDescription(`**<@${discordUser.id}>** has been demoted from the staff team.`)
                    .setThumbnail(skinUrl) // Set the skin as the thumbnail
                    .setTimestamp();

                await changelogChannel.send({ embeds: [embed] });
            } else {
                logger.error('Changelog channel is not a text channel or does not exist.');
            }

            // Send message to management log channel with reason
            const managementLogChannel = await interaction.guild?.channels.fetch('1346181934178369626'); // Replace with your management log channel ID
            if (managementLogChannel && managementLogChannel instanceof TextChannel) {
                await managementLogChannel.send(`User <@${discordUser.id}> has been demoted.\n**Reason:** ${finalReason}\n**Issuer:** <@${interaction.user.id}>`);
            } else {
                logger.error('Management log channel is not a text channel or does not exist.');
            }

            await interaction.editReply(`✅ Successfully demoted <@${discordUser.id}> from the staff team. \n**BE SURE TO REMOVE THEIR RANK IN GAME AND PERMS FROM THE DISCORD. THIS IS EXTREMELY IMPORTANT AND FAILURE TO DO SO WILL RESULT IN A PUNISHMENT AS IT'S YOUR RESPONSIBILITY. IF WE GET GRIEFED IT WILL BE YOUR RESPONSIBILITY AND YOU WILL BE TO BLAME.**\nIf you are unable to do it in game FIND SOMEONE to do it for you as its urgent.`);
        } catch (error) {
            logger.error('Error in demote command:', error);
            await interaction.editReply('❌ An error occurred while demoting the user.');
        }
    }
} 