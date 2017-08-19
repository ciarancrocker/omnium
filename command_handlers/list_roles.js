const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const Table = require('ascii-table');
const textHelpers = require('../lib/text_helpers');

const handler = async function(message) {
  if (!message.guild) {
    await messageHelpers.sendError(message,
      'This command must be run within a server.');
    return;
  }

  const roleIds = await db.pool.query('SELECT discord_id FROM bot_roles');
  const guildRoles = message.guild.roles.array();
  const table = new Table();
  for (let roleId of roleIds.rows) {
    const roleNames = guildRoles
      .filter((el) => el.id == roleId.discord_id)
      .map((el) => el.name);
    if (roleNames.length > 0) {
      table.addRow(roleNames[0]);
    }
  }

  textHelpers.paginateMessage(message, table.toString());
  return;
};

module.exports = {
  bind: 'list_roles',
  handler: handler,
  help: 'List the roles that can be joined using join_role',
};
