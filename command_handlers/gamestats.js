const database = require('../database');
const textHelpers = require('../text_helpers');
const Table = require('ascii-table');

const handler = async function(message) {
  const data = await database.getGameStatistics();
  const table = new Table();
  table.setHeading(['Rank', 'Game', 'Time Played']);
  for (let i = 0; i < data.length; i++) {
    table.addRow([(i+1), data[i].name, data[i].time.minutes + ' minutes']);
  }
  textHelpers.paginateMessage(message, table.toString());
};

module.exports = {
  bind: 'gamestats',
  handler: handler,
};
