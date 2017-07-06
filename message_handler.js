const moment = require('moment');
const Table = require('ascii-table');
const winston = require('winston');
const db = require('./database');

const fs = require('fs');

const sqlFiles = {};

fs.readdir('queries', (err, files) => {
  files.forEach(file => {
    if(file.match(/.+\.sql/)) {
      fs.readFile('queries/' + file, (err, data) => {
        if(err) {
          winston.log('error', 'Error loading query file %s', file, err);
        } else {
          winston.log('info', 'Loaded query file %s', file);
          sqlFiles[file] = data;
        }
      });
    }
  });
});

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
  let upperBound = 10;
  let limit = 10;

  const argv = message.content.split(' ');

  if(argv[1] && parseInt(argv[1])) {
    if(message.channel.type == 'dm') {
      upperBound = 100;
    }
    if(parseInt(argv[1]) > 0) {
      limit = Math.min(argv[1], upperBound);
    }
  }

  const sourceSql = sqlFiles["top-five-games.sql"];
  const sql = sourceSql.toString().replace('{{limit}}', limit);
  db.raw(sql).then(rows => {
    const table = new Table();
    table.setHeading('Rank', 'Game', 'Time played');
    let i = 1;
    rows[0].forEach(row => {
      table.addRow(
        i++,
        row.name,
        capitalizeFirstLetter(moment.duration(row.time, "seconds").humanize())
      );
    });
    //message.reply(table.toString(), { code: true });
    paginateMessage(message, table.toString());
  });
}

function handleSelfStatisticsMessage(message) {
  let upperBound = 10;
  let limit = 10;

  const argv = message.content.split(' ');

  if(argv[1] && parseInt(argv[1])) {
    if(message.channel.type == 'dm') {
      upperBound = 100;
    }
    if(parseInt(argv[1]) > 0) {
      limit = Math.min(argv[1], upperBound);
    }
  }

  const sourceSql = sqlFiles["selfstats.sql"];
  const sql = sourceSql.toString().replace('{{limit}}', limit).replace('{{user_id}}', message.author.id);
  db.raw(sql).then(rows => {
    const table = new Table();
    table.setHeading('Rank', 'Game', 'Time played');
    let i = 1;
    rows[0].forEach(row => {
      table.addRow(
        i++,
        row.name,
        capitalizeFirstLetter(moment.duration(row.time, "seconds").humanize())
      );
    });
    paginateMessage(message, table.toString());
  });
}

function handlePingMessage(message) {
  message.reply('pong');
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

