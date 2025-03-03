import { Events, GuildMember, Client, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

export default async (client: Client) => {
    client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
        const channel = member.guild.channels.cache.find(ch => ch.id === '1346189938437128284'); // Replace with your management log channel name

        if (channel && channel.isText()) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(':warning: Member Left :warning:')
                .setDescription(`🚪 **${member.user.tag}** has left the server. Please ensure to remove their rank in-game and on Discord.`)
                .setTimestamp();

            await channel.send({ content: '@everyone', embeds: [embed] });
        }

        logger.info(`User ${member.user.tag} has left the server. Notification sent.`);
    });
}; 