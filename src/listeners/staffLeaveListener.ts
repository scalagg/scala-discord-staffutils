import { Events, GuildMember, Client, EmbedBuilder, ChannelType } from 'discord.js';

export default async (client: Client) => {
    client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
        const channel = member.guild.channels.cache.find(ch => ch.id === '1346189938437128284'); // Replace with your management log channel ID

        if (channel && channel.type === ChannelType.GuildText) { // Check if it's a text channel
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(':warning: Member Left :warning:')
                .setDescription(`Member <@${member.id}> has left the server.`)
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }
    });
};