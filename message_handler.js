const moment = require('moment');
const Table = require('ascii-table');
const winston = require('winston');
const db = require('./database');
const db_helpers = require('./database_helpers');

module.exports.handleMessage = function(message) {
  if(message.content[0] == process.env.COMMAND_PREFIX)
  {
    winston.log('info', 'Handling command %s from %s', message.content, message.author.tag);
    switch(message.content.slice(1).split(' ')[0])
    {
      case 'gamestats':
        handleGameStatisticsMessage(message);
        break;
      case 'selfstats':
        handleSelfStatisticsMessage(message);
        break;
      case 'ping':
        handlePingMessage(message);
        break;
    }
  }
};

function handleGameStatisticsMessage(message) {
  const limit = getLimitFromMessage(message);

  db_helpers.getGlobalStatistics(limit)
    .then(makeTable)
    .then(table => paginateMessage(message, table));
}

function handleSelfStatisticsMessage(message) {
  const limit = getLimitFromMessage(message);

  db_helpers.getStatisticsForUser(message.author.id, limit)
    .then(makeTable)
    .then(table => paginateMessage(message, table));
}

function handlePingMessage(message) {
  message.reply('pong');
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function makeTable(games) {
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
