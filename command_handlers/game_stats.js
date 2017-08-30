const database = require('../lib/database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const Table = require('ascii-table');

const formatInterval = function(interval) {
  return moment.duration(interval).format();
};

module.exports = {
  bind: 'game_stats',
  handler: async function(message) {
    let args = textHelpers.getArgs(message.content);
    let data = [];

    if (isNaN(args[1]) && typeof args[1] !== 'undefined') {
      data = await database.getGameStatisticsString(
        args[1].replace(/\"/g, '').replace(/\'/g, ''),
        args[2]
      );
    } else {
      if (typeof args[1] !== 'undefined') {
        data = await database.getGameStatistics(parseInt(args[1]));
      } else {
        data = await database.getGameStatistics(10);
      }
    }

    const table = new Table();
    table.setHeading(['Rank', 'Game', 'Time Played']);
    for (let i = 0; i < data.length; i++) {
      table.addRow([(i+1), data[i].name, formatInterval(data[i].time)]);
    }
    textHelpers.paginateMessage(message, table.toString());
  },
  help: 'Show game statistics for the server',
};
