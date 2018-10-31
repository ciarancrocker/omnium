const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const Table = require('ascii-table');
const textHelpers = require('../lib/text_helpers');

if (process.env.FEAT_ROLES) {
  module.exports = {
    bind: 'list_roles',
    handler: async function(message) {
      if (!message.guild) {
        await messageHelpers.sendError(message,
          'This command must be run within a server.');
        return;
      }

      const roleIds = await db.pool
        .query('SELECT discord_id FROM bot_roles');
      const guildRoles = message.guild.roles.array();
      let roleNames = [];
      for (let roleId of roleIds.rows) {
        const roleName = guildRoles
          .filter((el) => el.id == roleId.discord_id)
          .map((el) => el.name);
        if (roleName.length > 0) {
          roleNames.push(roleName[0]);
        }
      }
      roleNames = roleNames.sort();
      if (roleNames.length > 0) {
        const table = new Table();
        for (let role of roleNames) {
          table.addRow(role, `${process.env.COMMAND_PREFIX}join_role ${role}`);
        }

        textHelpers.paginateMessage(message, table.toString());
      } else {
        await message.reply('No roles configured.');
      }
      return;
    },
    help: 'List the roles that can be joined using join_role',
  };
}
