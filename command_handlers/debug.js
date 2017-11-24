const db = require('../lib/database');
const Table = require('ascii-table');
const textHelpers = require('../lib/text_helpers');

if (process.env.FEAT_UTIL) {
  module.exports = {
    bind: 'debug',
    administrative: true,
    handler: async function(message) {
      // channel configuration
      const channels = await db.pool.query('SELECT * FROM channels ORDER BY id');
      const channelsTable = new Table('Configured channels');
      channelsTable.setHeading('id', 'discord_id', 'name', 'temporary', 'temporary_index');
      channels.rows.forEach((row) =>
        channelsTable.addRow(row.id, row.discord_id, row.name, row.temporary ? 'TRUE' : 'FALSE', row.temporary_index));

      // general numeric statistics
      const generalStats = await db.pool.query('SELECT (SELECT COUNT(*) FROM game_sessions) AS session_count, ' +
        '(SELECT COUNT(*) FROM games) AS game_count, MAX(game_sessions.session_start) AS latest_session ' +
        'FROM game_sessions;');
      const statsTable = new Table('General statistics');
      const stats = generalStats.rows[0];
      statsTable.setHeading('Session count', 'Unique game count', 'Latest tracked session start');
      statsTable.addRow(stats.session_count, stats.game_count, stats.latest_session);

      // prepare reply
      let reply = channelsTable.toString();
      reply += '\n\n';
      reply += statsTable.toString();

      await textHelpers.paginateMessageToFunction(message.member.send.bind(message.member), reply);
      await message.delete();
    },
    help: 'Display configuration and debug information.',
  };
}
