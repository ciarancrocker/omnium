const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const Table = require('ascii-table');
const textHelpers = require('../lib/text_helpers');

module.exports = {
  bind: 'list_roles',
  handler: async function(message) {
    if (!message.guild) {
      await messageHelpers.sendError(message,
        'This command must be run within a server.');
      return;
    }

    const roleIds = await db.pool
      .query('SELECT discord_id FROM bot_roles ORDER BY sort_index ASC');
    const guildRoles = message.guild.roles.array();
    const table = new Table();
    for (let roleId of roleIds.rows) {
      const roleNames = guildRoles
        .filter((el) => el.id == roleId.discord_id)
        .map((el) => el.name);
      if (roleNames.length > 0) {
        table.addRow(roleNames[0],
          `${process.env.COMMAND_PREFIX}join_role ${roleNames[0]}`);
      }
    }

    textHelpers.paginateMessage(message, table.toString());
    return;
  },
  help: 'List the roles that can be joined using join_role',
};
