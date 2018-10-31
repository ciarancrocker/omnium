const db = require('../lib/database');
const Table = require('ascii-table');
const textHelpers = require('../lib/text_helpers');

if (process.env.FEAT_STATIC_COMMANDS) {
  module.exports = {
    bind: 'list_commands',
    handler: async function(message) {
      const commands = await db.getAllStaticCommands();
      if (commands.length > 0) {
        const table = new Table();
        table.setHeading('Command');
        for (let command of commands) {
          table.addRow(command.command);
        }
        textHelpers.paginateMessage(message, table.toString());
      } else {
        await message.reply('No commands configured.');
      }
    },
    administrative: true,
    help: 'List all commands',
  };
}

