const db = require('../lib/database');
const {RichEmbed} = require('discord.js');

module.exports = {
  bind: 'server_stats',
  handler: async function(message) {
    const {rows: aggregateStats} = await db.pool.query('SELECT max(total_members) as max_members, max(online_members) as max_online_members FROM server_statistics');
    const embed = new RichEmbed();
    embed.setTitle('Aggregate server statistics')
      .addField('Peak total members', aggregateStats[0].max_members, true)
      .addField('Peak online members', aggregateStats[0].max_online_members, true)
      .setColor(0x004d00);
    await message.channel.send(embed);
  },
  administrative: true,
  help: 'Display server membership statistics',
};

