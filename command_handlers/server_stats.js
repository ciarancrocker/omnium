const db = require('../lib/database');
const {MessageEmbed} = require('discord.js');

module.exports = {
  bind: 'server_stats',
  handler: async function(message) {
    const {rows: aggregateStats} = await db.pool.query('SELECT max(total_members) as max_members, max(online_members) as max_online_members FROM server_statistics');

    const guild = message.guild;
    await guild.members.fetch();
    const members = guild.members.cache.array();
    const onlineMembers = members.filter((x) => x.presence.status != 'offline');

    const embed = new MessageEmbed();
    embed.setTitle('Aggregate server statistics')
        .addField('Current total members', members.length, true)
        .addField('Peak total members', aggregateStats[0].max_members, true)
        .addField('Current online members', onlineMembers.length, true)
        .addField('Peak online members', aggregateStats[0].max_online_members, true)
        .setColor(0x004d00);
    await message.channel.send(embed);
  },
  administrative: true,
  help: 'Display server membership statistics',
};

