const db = require('./database');
const winston = require('winston');

module.exports = async function(client) {
  // grab all members, filter to online players
  const guild = client.guilds.first();
  await guild.fetchMembers();

  const members = guild.members.array();
  const onlineMembers = members.filter((x) => x.presence.status != 'offline');

  // now do things for roles
  const roles = guild.roles.array().map((x) => ({role: x.name, members: x.members.array().filter((y) => y.presence.status != 'offline').length}));

  await db.pool.query('INSERT INTO server_statistics (total_members, online_members, online_role_members) VALUES ($1, $2, $3)', [members.length, onlineMembers.length, JSON.stringify(roles)]);
  winston.log('info', 'Updated server member statistics');

  return;
};
