const db = require('./database');
const logger = require('./logging');

module.exports = async function(client) {
  // grab all members, filter to online players
  const guild = client.guilds.cache.first();
  await guild.members.fetch();

  const members = guild.members.cache.array();
  const onlineMembers = members.filter((x) => x.presence.status != 'offline');

  // now do things for roles
  const roles = guild.roles.cache.array().map((x) => ({role: x.name, members: x.members.array().filter((y) => y.presence.status != 'offline').length}));

  await db.pool.query('INSERT INTO server_statistics (total_members, online_members, online_role_members) VALUES ($1, $2, $3)', [members.length, onlineMembers.length, JSON.stringify(roles)]);
  logger.log('info', 'Updated server member statistics');

  return;
};
