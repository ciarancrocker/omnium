const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const logger = require('../lib/logging');

if (process.env.FEAT_ROLES) {
  module.exports = {
    bind: 'delete_role',
    handler: async function(message) {
      if (!message.guild) {
        await messageHelpers.sendError(message, 'This command must be run within a server.');
        return;
      }

      const roleName = message.content.split(' ').slice(1).join(' ').toLowerCase();
      const roles = message.guild.roles.cache.array().filter((el) => el.name.toLowerCase() == roleName);
      if (roles.length == 0) {
        await messageHelpers.sendError(message, 'The specified role does not exist.');
        return;
      }

      // verify the role is bot managed
      const dbResult = await db.pool.query('SELECT true FROM bot_roles WHERE discord_id = $1', [roles[0].id]);
      if (dbResult.rowCount == 0) {
        await messageHelpers.sendError(message, 'The specified role is not bot managed');
        return;
      }

      // delete the role from discord and the database
      await roles[0].delete();
      await db.pool.query('DELETE FROM bot_roles WHERE discord_id = $1', [roles[0].id]);
      await message.reply(`Role ${roleName} deleted`);
      logger.log('info', `Role ${roleName} deleted`);
    },
    help: 'Delete a bot-managed role',
    administrative: true,
  };
}
