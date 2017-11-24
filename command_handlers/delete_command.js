const db = require('../lib/database');

if (process.env.FEAT_STATIC_COMMANDS) {
  module.exports = {
    bind: 'delete_command',
    handler: async function(message) {
      const [, command] = message.content.split(' ');
      await db.deleteStaticCommand(command);
      await message.reply('Command deleted.');
    },
    administrative: true,
    help: 'Delete a static command',
  };
}
