const db = require('./database');
const fs = require('fs');
const moment = require('moment');
const Table = require('ascii-table');
const winston = require('winston');

// pre-load all the big queries we need
const sqlFiles = {};
fs.readdir('queries', (err, files) => {
  files.forEach(file => {
    if(file.match(/^.+\.sql$/)) {
      fs.readFile('queries/' + file, (err, data) => {
        if(err) {
          winston.log('error', 'Error loading query file %s', file, err);
        } else {
          winston.log('info', 'Loaded query file %s', file);
          sqlFiles[file] = data.toString();
        }
      });
    }
  });
});

module.exports.getGlobalStatistics = function(limit) {
  return new Promise(function(resolve, reject) {
    const sourceSql = sqlFiles['top-five-games.sql'];
    const sql = sourceSql.replace('{{limit}}', limit);
    db.raw(sql).then(rows => {
      const table = new Table();
      table.setHeading('Rank', 'Game', 'Time played');
      let i = 1;
      rows[0].forEach(row => {
        table.addRow(
          i++,
          row.name,
          capitalizeFirstLetter(moment.duration(row.time, 'seconds').humanize())
        );
      });
      resolve(table.toString());
    });
  });
}

module.exports.getStatisticsForUser = function(user_id, limit) {
  return new Promise(function(resolve, reject) {
    const sourceSql = sqlFiles["selfstats.sql"];
    const sql = sourceSql.replace('{{user_id}}', user_id).replace('{{limit}}', limit);
    db.raw(sql).then(rows => {
      const table = new Table();
      table.setHeading('Rank', 'Game', 'Time Played');
      let i = 1;
      rows[0].forEach(row => {
        table.addRow(
          i++,
          row.name,
          capitalizeFirstLetter(moment.duration(row.time, 'seconds').humanize())
        );
      });
      resolve(table.toString());
    });
  });
}

// local helpers
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


