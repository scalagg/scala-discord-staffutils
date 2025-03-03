import { Events, GuildMember, Client } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getCollection } from '../utils/mongo.js'; 

export default async (client: Client) => {
    client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
        const auditLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_KICK',
        });
        const kickLog = auditLogs.entries.first();

        if (kickLog && kickLog.target.id === member.id) {
            const reason = 'Kicked by a Staff Manager';
            const managementLogChannel = await member.guild.channels.fetch('1346181934178369626');

            if (managementLogChannel && managementLogChannel.isText()) {
                await managementLogChannel.send(`User <@${member.id}> has been demoted.\n**Reason:** ${reason}\n**Issuer:** <@${kickLog.executor.id}>`);
            }

            logger.info(`User ${member.user.tag} was kicked. Reason: ${reason}`);
        }
    });

    client.on(Events.GuildBanAdd, async (ban) => {
        const reason = 'Banned by a Staff Manager';
        const managementLogChannel = await ban.guild.channels.fetch('1346181934178369626'); 

        if (managementLogChannel && managementLogChannel.isText()) {
            await managementLogChannel.send(`User <@${ban.user.id}> has been demoted.\n**Reason:** ${reason}\n**Issuer:** Staff Management`);
        }

        logger.info(`User ${ban.user.tag} was banned. Reason: ${reason}`);
    });
}; 