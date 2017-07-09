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
      resolve(rows[0]);
    });
  });
}

module.exports.getStatisticsForUser = function(user_id, limit) {
  return new Promise(function(resolve, reject) {
    const sourceSql = sqlFiles["selfstats.sql"];
    const sql = sourceSql.replace('{{user_id}}', user_id).replace('{{limit}}', limit);
    db.raw(sql).then(rows => {
      resolve(rows[0]);
    });
  });
}

module.exports.addEvent = function(user_id, game, event) {
  findOrCreateGame(game)
    .then(game_id => db('GameLog').insert({ user_id, event, game_id }))
    .then(() => {
      winston.log('debug', 'Logged presence change event', { user_id, game, event });
    }).catch(err => {
      winston.log('error', 'Failed to log presence change event, aborting', err);
    });
}

// local helpers
const gameCache = {};
function findOrCreateGame(game_name) {
  return new Promise(function(resolve, reject) {
    if(gameCache[game_name]) {
      resolve(gameCache[game_name]);
    } else {
      db('Games').select('id').where({ name: game_name }).then(rows => {
        if(rows.length > 0) {
          winston.log('debug', 'Caching existing game', {game_name, game_id: rows[0].id});
          gameCache[game_name] = rows[0].id;
          resolve(rows[0].id);
        } else {
          db('Games').insert({ name: game_name }).then(insertedRows => {
            winston.log('debug', 'Created new game record', { game_name, game_id: insertedRows[0] });
            gameCache[game_name] = insertedRows[0];
            resolve(insertedRows[0]);
          });
        }
      });
    }
  });
}
