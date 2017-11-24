const db = require('../lib/database');

if (process.env.FEAT_STATIC_COMMANDS) {
  module.exports = {
    bind: 'edit_command',
    handler: async function(message) {
      const [, command, ...textSplit] = message.content.split(' ');
      const text = textSplit.join(' ');
      await db.updateStaticCommand(command, text);
      await message.reply('Command updated.');
    },
    administrative: true,
    help: 'Edit a static command',
  };
}
