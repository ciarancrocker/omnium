const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const logger = require('../lib/logging');

if (process.env.FEAT_ROLES) {
  module.exports = {
    bind: 'leave_role',
    handler: async function(message) {
      if (!message.guild) {
        await messageHelpers.sendError(message, 'This command must be run within a server.');
        return;
      }

      const roleName = message.content.split(' ').slice(1).join(' ').toLowerCase();
      const userRoles = message.member.roles.cache.array().filter((el) => el.name.toLowerCase() == roleName);
      if (userRoles.length == 0) {
        await messageHelpers.sendError(message, 'You\'re not a member of that role.');
        return;
      }

      // verify the role is bot managed
      const dbResult = await db.pool.query('SELECT true FROM bot_roles WHERE discord_id = $1', [userRoles[0].id]);
      if (dbResult.rowCount == 0) {
        await messageHelpers.sendError(message, 'The specified role is not managed by this bot.');
        return;
      }

      await message.member.roles.remove(userRoles[0]);
      const outMessage = await message.reply(`You were removed from the role ${userRoles[0].name}`);
      logger.log('info', `User ${message.author.tag} was removed from the role ${userRoles[0].name}`);

      // self destruct messages
      message.delete({timeout: 5000});
      outMessage.delete({timeout: 5000});

      // log the event
      db.logEvent('leave_role', {user_id: message.member.id, role: roleName});
    },
    help: 'Leave a role managed by this bot',
  };
}
