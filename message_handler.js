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
    switch(message.content.slice(1))
    {
      case 'gamestats':
        handleGameStatisticsMessage(message);
        break;
      case 'ping':
        handlePingMessage(message);
        break;
    }
  }
};

function handleGameStatisticsMessage(message) {
  winston.log('debug', 'handleGameStatisticsMessage');
  db.raw(sqlFiles["top-five-games.sql"]).then(rows => {
    const table = new Table();
    table.setHeading('Game', 'Time');
    rows[0].forEach(row => {
      table.addRow(row.game, (row.time / 1000));
    });
    message.reply(table.toString(), { code: true });
  });
}

function handlePingMessage(message) {
  message.reply('pong');
}
