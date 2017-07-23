const database = require('../database');
const Table = require('ascii-table');
const textHelpers = require('../text_helpers');

const handler = async function(message) {
  const lastFiftySessions = await database.pool.query(
    'SELECT * FROM game_sessions ORDER BY id DESC LIMIT 50');
  const table = new Table();
  table.setHeading('id', 'user_id', 'game_id', 'session_start', 'session_end',
    'state');
  lastFiftySessions.rows.forEach((row) => {
    table.addRow(row.id, row.user_id, row.game_id, row.session_start,
      row.session_end, row.state);
  });
  textHelpers.paginateMessage(message, table.toString());
};

module.exports = {
  bind: 'debug_sessions',
  handler: handler,
};
