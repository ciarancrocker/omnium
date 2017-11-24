const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const winston = require('winston');

if (process.env.FEAT_ROLES) {
  module.exports = {
    bind: 'create_role',
    handler: async function(message) {
      if (!message.guild) {
        await messageHelpers.sendError(message,
          'This command must be run within a server.');
        return;
      }

      const roleName = message.content.split(' ').slice(1).join(' ');
      const newRole = await message.guild.createRole({
        data: {
          name: roleName,
          hoist: false,
          mentionable: true,
        },
      });

      await db.pool.query('INSERT INTO bot_roles (discord_id) VALUES ($1)',
        [newRole.id]);

      const logMessage = `Role '${roleName}' created with ID ${newRole.id}`;
      message.reply(logMessage);
      winston.log('info', logMessage);
    },
    help: 'Create a new bot-managed role',
    administrative: true,
  };
}
