const db = require('../lib/database');
const Table = require('ascii-table');
const textHelpers = require('../lib/text_helpers');

module.exports = {
  bind: 'list_commands',
  handler: async function(message) {
    const commands = await db.getAllStaticCommands();
    const table = new Table();
    table.setHeading('Command', 'Text');
    for (let command of commands) {
      table.addRow(command.command, command.return_text);
    }
    textHelpers.paginateMessage(message, table.toString());
  },
  administrative: true,
  help: 'List all commands',
};


