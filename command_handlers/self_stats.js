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

      const args = textHelpers.getArgs(message.content);
      let data = [];

      // calling patterns for this command:
      // P1: game_stats <gamename: word>
      // P2: game_stats <gamename: word> <limit: number>
      // P3: game_stats <limit: number>
      // P4: game_stats

      if (isNaN(args[1]) && typeof args[1] !== 'undefined') {
        // we are pattern P1 or P2
        let limit = 20;
        if (!isNaN(args[2])) {
          // handle P2, get the limit
          limit = Math.min(20, parseInt(args[2]));
        }
        data = await database.getUserStatisticsForGame(
            userId,
            args[1].replace(/["']/g, ''), // remove any quotes there may be
            limit,
        );
      } else {
        // P3 or P4
        let limit = 10;
        if (typeof args[1] !== 'undefined' && !isNaN(args[1])) {
          // P3, get limit
          limit = Math.min(20, parseInt(args[1]));
        }
        data = await database.getUserGameStatistics(userId, limit);
      }

      if (data.length > 0) {
        const table = new Table();
        table.setHeading(['Rank', 'Game', 'Time Played']);
        for (let i = 0; i < data.length; i++) {
          table.addRow([(i+1), data[i].display_name, formatInterval(data[i].time)]);
        }
        textHelpers.paginateMessageToFunction(message.author.send.bind(message.author), table.toString());
        await message.delete();
      } else {
        await message.reply('Not enough information gathered. Check back later.');
      }
    },
    help: 'Show your game statistics',
  };
}
