const database = require('../lib/database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const messageHelpers = require('../lib/message_helpers');
const Table = require('ascii-table');

const handler = async function(message) {
  const args = message.content.split(' ').slice(1);

  // argument 0 is the user to search for
  const mentions = message.mentions.members.array();
  if (mentions.length == 0) {
    await messageHelpers.sendError(message, 'No user specified');
    return;
  }
  const targetUser = mentions[0].user;

  // argument 1 should be the limit
  let limit = 10;
  if (args.length > 1) {
    limit = Number(args[1]);
  }
  if (message.guild) {
    limit = Math.min(10, limit);
  }
  const userId = await database.findOrCreateUser(targetUser);
  const data = await database.getUserGameStatistics(userId, limit);
  const table = new Table();
  table.setHeading(['Rank', 'Game', 'Time Played']);
  for (let i = 0; i < data.length; i++) {
    table.addRow([(i+1), data[i].name, formatInterval(data[i].time)]);
  }
  textHelpers.paginateMessage(message, table.toString());
};

const formatInterval = function(interval) {
  return moment.duration(interval).format();
};

module.exports = {
  bind: 'user_stats',
  handler: handler,
  help: 'Show game statistics for the specified user',
  administrative: true,
};
