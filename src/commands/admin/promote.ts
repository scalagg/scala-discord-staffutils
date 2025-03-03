import { ChatInputCommandInteraction, EmbedBuilder, TextChannel, AutocompleteInteraction } from 'discord.js';
import { Command } from '../../structures/Command.js';
import { logger } from '../../utils/logger.js';
import { getCollection } from '../../utils/mongo.js';
import { getMinecraftSkin } from '../../utils/skinAPI.js';
import { getMinecraftUser } from '../../utils/redis.js';

export default class PromoteCommand extends Command {
    constructor() {
        super({
            name: 'promote',
            description: 'Promote a user to a specified rank',
            category: 'Staff Management',
            roleIds: [
                '1338974800508485693',
                '1338974815255793718',
                '1338974844187971614',
            ],
            guildOnly: true
        });

        this.data
            .addUserOption(option =>
                option
                    .setName('discorduser')
                    .setDescription('The Discord user to promote')
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
                    .setName('rank')
                    .setDescription('The rank to promote the user to')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addBooleanOption(option =>
                option
                    .setName('silentpromote')
                    .setDescription('If true, suppress sending the promotion message to the changelog channel')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option
                    .setName('subteam')
                    .setDescription('The subteam to assign the user to')
                    .setRequired(false)
                    .addChoices(
                        { name: 'Head Of ScreenShare', value: 'Head Of ScreenShare' },
                        { name: 'Staff Management', value: 'Staff Management' },
                        { name: 'Content Creator Council', value: 'Content Creator Council' },
                        { name: 'AntiCheat Operations', value: 'AntiCheat Operations' },
                        { name: 'Community Management', value: 'Community Management' },
                        { name: 'Build Leader', value: 'Build Leader' },
                        { name: 'Event Coordinator', value: 'Event Coordinator' }
                    )
            );
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: ['Ephemeral'] });

            const discordUser = interaction.options.getUser('discorduser', true);
            const minecraftUser = interaction.options.getString('minecraftuser', true);
            const rankName = interaction.options.getString('rank', true);
            const silentPromote = interaction.options.getBoolean('silentpromote') || false;
            const subTeam = interaction.options.getString('subteam');

            // Fetch ranks from MongoDB
            const collection = await getCollection('Rank');
            const ranks = await collection.find({}).toArray();

            logger.debug('Fetched ranks from MongoDB:', ranks);

            const rank = ranks.find(r => r.name.toLowerCase() === rankName.toLowerCase());

            if (!rank) {
                await interaction.editReply(`❌ Rank "${rankName}" not found.`);
                return;
            }

            // Check if the subteam is valid for the user
            if (subTeam === 'Staff Management' && !interaction.member.roles.cache.has('1338974800508485693')) {
                await interaction.editReply(`❌ You do not have permission to assign the "${subTeam}" subteam.`);
                return;
            }

            // Fetch Minecraft skin
            const skinUrl = await getMinecraftSkin(minecraftUser);
            if (!skinUrl) {
                await interaction.editReply(`❌ Minecraft user "${minecraftUser}" not found.`);
                return;
            }

            // Send embed message to #changelog if not silent
            if (!silentPromote) {
                const changelogChannel = await interaction.guild?.channels.fetch('1338011148775325770');
                if (changelogChannel && changelogChannel instanceof TextChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('User Promoted')
                        .setDescription(`:tada: **<@${discordUser.id}>** has been promoted to **${rank.name}**`)
                        .addFields(
                            { name: 'Minecraft Username', value: minecraftUser, inline: true },
                            { name: 'Rank', value: rank.name, inline: true },
                            { name: 'Subteam', value: subTeam || 'None', inline: true }
                        )
                        .setThumbnail(skinUrl)
                        .setTimestamp();

                    await changelogChannel.send({ embeds: [embed] });
                } else {
                    logger.error('Changelog channel is not a text channel or does not exist.');
                    await interaction.editReply('❌ Failed to send promotion message to changelog channel.');
                }
            }

            await interaction.editReply(`✅ Successfully promoted <@${discordUser.id}> to **${rank.name}**.\n**Make sure to update the roles in Game and in the Main Discord.**\n-# *You will not have to do this in the future as it will be automated.*`);
        } catch (error) {
            logger.error('Error in promote command:', error);
            await interaction.editReply('❌ An error occurred while promoting the user.');
        }
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        logger.debug('Autocomplete triggered for rank option');

        const focusedValue = interaction.options.getString('rank', true);

        // Fetch ranks from MongoDB
        const collection = await getCollection('Rank');
        const ranks = await collection.find({}).toArray();

        logger.debug('Fetched ranks for autocomplete:', ranks);

        const filteredRanks = ranks.filter(rank => 
            rank.name.toLowerCase().includes(focusedValue.toLowerCase())
        );

        logger.debug('Filtered ranks for autocomplete:', filteredRanks);

        const options = filteredRanks.map(rank => ({
            name: rank.name,
            value: rank.name
        }));

        await interaction.respond(options);
    }
} 