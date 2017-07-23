const database = require('../database');
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
  let outString = '';
  if(interval.days) {
    interval.hours += (interval.days * 24);
  }
  if(interval.hours) {
    outString += interval.hours + ' hours, ';
  }
  if(interval.minutes) {
    outString += interval.minutes + ' minutes, ';
  }
  if(interval.seconds) {
    outString += interval.seconds + ' seconds';
  }
  return outString;
};

module.exports = {
  bind: 'gamestats',
  handler: handler,
};
