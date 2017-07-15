const db = require('./database');
const fs = require('fs');
const winston = require('winston');

// pre-load all the big queries we need
const sqlFiles = {};
fs.readdir('queries', (err, files) => {
  files.forEach((file) => {
    if (file.match(/^.+\.sql$/)) {
      fs.readFile('queries/' + file, (err, data) => {
        if (err) {
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
    const sourceSql = sqlFiles['gamestats.sql'];
    const sql = sourceSql.replace('{{limit}}', limit);
    db.raw(sql).then((rows) => {
      resolve(rows[0]);
    });
  });
};

module.exports.getStatisticsForUser = function(userId, limit) {
  return new Promise(function(resolve, reject) {
    const sourceSql = sqlFiles['selfstats.sql'];
    const sql = sourceSql
      .replace('{{user_id}}', userId)
      .replace('{{limit}}', limit);
    db.raw(sql).then((rows) => {
      resolve(rows[0]);
    });
  });
};

module.exports.addEvent = function(userId, game, event) {
  findOrCreateGame(game)
    .then((gameId) => db('game_log').insert(
      {user_id: userId, event, game_id: gameId}
    ))
    .then(() => {
      winston.log('debug', 'Logged presence change event',
        {userId, game, event});
    }).catch((err) => {
      winston.log('error',
        'Failed to log presence change event, aborting', err);
    });
};

// local helpers
const gameCache = {};
/**
 * Get the id for provided name, or create one if not found.
 *
 * @param {string} gameName - Name of game to search for
 * @return {number} ID of specified game
 */
function findOrCreateGame(gameName) {
  return new Promise(function(resolve, reject) {
    if (gameCache[gameName]) {
      resolve(gameCache[gameName]);
    } else {
      db('games').select('id').where({name: gameName}).then((rows) => {
        if (rows.length > 0) {
          winston.log('debug', 'Caching existing game',
            {gameName, gameId: rows[0].id});
          gameCache[gameName] = rows[0].id;
          resolve(rows[0].id);
        } else {
          db('games').insert({name: gameName}).then((insertedRows) => {
            winston.log('debug', 'Created new game record',
              {gameName, gameId: insertedRows[0]});
            gameCache[gameName] = insertedRows[0];
            resolve(insertedRows[0]);
          });
        }
      });
    }
  });
}
