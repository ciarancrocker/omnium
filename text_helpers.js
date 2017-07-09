const moment = require('moment');
const Table = require('ascii-table');

function getLimitFromMessage(message) {
  let upperBound = 10;
  let limit = 10;

  const args = message.content.split(' ');
  if(args[1] && parseInt(args[1])) {
    // DMs get a slightly higher upper bound
    if(message.channel.type == 'dm') {
      upperBound = 100;
    }

    const argument = parseInt(args[1]);

    if(argument > 0) {
      limit = Math.min(argument, upperBound);
    }
  }

  return limit;
}

function makeGameTable(games) {
  return new Promise(function(resolve, reject) {
    const table = new Table();
    table.setHeading('Rank', 'Game', 'Time Played');
    for(let i = 0; i < games.length; i++) {
      table.addRow(
        (i + 1),
        games[i].name,
        capitalizeFirstLetter(moment.duration(games[i].time, 'seconds').humanize())
      );
    }
    resolve(table.toString());
  });
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function paginateMessage(message, textToSend) {
  const limit = 2000;
  if(textToSend.length <= limit) {
    message.reply(textToSend, { code: true });
    return;
  }
  let split = limit;
  for(let i = limit; i > 0; i--) {
    if(textToSend[i] == "\n") {
      split = i;
      break;
    }
  }
  message.reply(textToSend.slice(0, Math.min(split, textToSend.length)), { code: true });
  paginateMessage(message, textToSend.slice(split));
}

module.exports = {
  getLimitFromMessage,
  makeGameTable,
  capitalizeFirstLetter,
  paginateMessage,
};
