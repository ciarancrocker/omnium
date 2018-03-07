const database = require('../lib/database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const Table = require('ascii-table');

const formatInterval = function(interval) {
  return moment.duration(interval).format();
};

if (process.env.FEAT_STATS) {
  module.exports = {
    bind: 'self_stats',
    handler: async function(message) {
      const userId = await database.findOrCreateUser(message.author);

      let args = textHelpers.getArgs(message.content);
      let data = [];

      if (isNaN(args[1]) && typeof args[1] !== 'undefined') {
        data = await database.getUserStatisticsForGame(
          userId,
          args[1].replace(/["']/g, ''),
          args[2]
        );
      } else {
        if (typeof args[1] !== 'undefined') {
          data = await database.getUserGameStatistics(userId, parseInt(args[1]));
        } else {
          data = await database.getUserGameStatistics(userId, 10);
        }
      }

      const table = new Table();
      table.setHeading(['Rank', 'Game', 'Time Played']);
      for (let i = 0; i < data.length; i++) {
        table.addRow([(i+1), data[i].display_name, formatInterval(data[i].time)]);
      }
      textHelpers.paginateMessageToFunction(message.author.send.bind(message.author), table.toString());
    },
    help: 'Show your game statistics',
  };
}
