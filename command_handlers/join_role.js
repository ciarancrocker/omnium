const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const logger = require('../lib/logging');

if (process.env.FEAT_ROLES) {
  module.exports = {
    bind: 'join_role',
    handler: async function(message) {
      if (!message.guild) {
        await messageHelpers.sendError(message, 'This command must be run within a server.');
        return;
      }

      const roleName = message.content.split(' ').slice(1).join(' ').toLowerCase();
      const roles = message.guild.roles.array().filter((el) => el.name.toLowerCase() == roleName);
      if (roles.length == 0) {
        await messageHelpers.sendError(message, 'The specified role does not exist.');
        return;
      }

      // verify the role is bot managed
      const dbResult = await db.pool.query('SELECT true FROM bot_roles WHERE discord_id = $1', [roles[0].id]);
      if (dbResult.rowCount == 0) {
        await messageHelpers.sendError(message, 'The specified role cannot be joined using join_role');
        return;
      }

      await message.member.addRole(roles[0].id);
      const outMessage = await message.reply(`You were added to the role ${roleName}`);
      logger.log('info', `User ${message.author.tag} was added to the role ${roleName}`);

      // self destruct messages
      message.delete(5000);
      outMessage.delete(5000);

      // log the event
      db.logEvent('join_role', {user_id: message.member.id, role: roleName});
    },
    help: 'Join a role managed by this bot',
  };
}
