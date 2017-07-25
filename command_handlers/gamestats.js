const database = require('../database');
const moment = require('moment');
require('moment-duration-format');
const textHelpers = require('../text_helpers');
const Table = require('ascii-table');

const handler = async function(message) {
  const data = await database.getGameStatistics();
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
  bind: 'gamestats',
  handler: handler,
  help: 'Show game statistics for the server',
};
