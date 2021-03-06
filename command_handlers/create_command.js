const db = require('../lib/database');

if (process.env.FEAT_STATIC_COMMANDS) {
  module.exports = {
    bind: 'create_command',
    handler: async function(message) {
      const [, command, ...textSplit] = message.content.split(' ');
      const text = textSplit.join(' ');
      await db.createStaticCommand(command, text);
      await message.reply('Command created.');
    },
    administrative: true,
    help: 'Create a static command',
  };
}
