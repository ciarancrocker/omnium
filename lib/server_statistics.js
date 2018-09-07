const db = require('./database');
const winston = require('winston');

module.exports = async function(client) {
  // grab all members, filter to online players
  const guild = client.guilds.first();
  await guild.fetchMembers();

  const members = guild.members.array();
  const onlineMembers = members.filter((x) => x.presence.status != 'offline');

  await db.pool.query('INSERT INTO server_statistics (total_members, online_members) VALUES ($1, $2)', [members.length, onlineMembers.length]);
  winston.log('info', 'Updated server member statistics');

  return;
};
