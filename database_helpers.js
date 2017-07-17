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
    db.raw(sql).then((result) => {
      resolve(result.rows);
    });
  });
};

module.exports.getStatisticsForUser = function(user, limit) {
  return new Promise(function(resolve, reject) {
    findOrCreateUser(user).then((userCacheId) => {
      const sourceSql = sqlFiles['selfstats.sql'];
      const sql = sourceSql
        .replace('{{user_id}}', userCacheId)
        .replace('{{limit}}', limit);
      db.raw(sql).then((result) => {
        resolve(result.rows);
      });
    });
  });
};

module.exports.addEvent = function(user, game, event) {
  let gameId, userCacheId;
  Promise.all([
    findOrCreateGame(game).then((_gameId) => gameId = _gameId),
    findOrCreateUser(user).then((_userCacheId) => userCacheId = _userCacheId),
  ]).then(() => db('game_log').insert(
    {user_cache_id: userCacheId, event, game_id: gameId}
  )).then(() => {
    winston.log('debug', 'Logged presence change event',
      {userId: user.id, game, event});
  }).catch((err) => {
    winston.log('error',
      'Failed to log presence change event, aborting', err);
  });
};

// local helpers
const cache = {
  games: {},
  users: {},
};
/**
 * Get the id for provided name, or create one if not found.
 *
 * @param {string} gameName - Name of game to search for
 * @return {number} ID of specified game
 */
function findOrCreateGame(gameName) {
  return new Promise(function(resolve, reject) {
    if (cache.games[gameName]) {
      resolve(cache.games[gameName]);
    } else {
      db('games').select('id').where({name: gameName}).then((rows) => {
        if (rows.length > 0) {
          winston.log('debug', 'Caching existing game',
            {gameName, gameId: rows[0].id});
          cache.games[gameName] = rows[0].id;
          resolve(rows[0].id);
        } else {
          db('games').insert({name: gameName}).then((insertedRows) => {
            winston.log('debug', 'Created new game record',
              {gameName, gameId: insertedRows[0]});
            cache.games[gameName] = insertedRows[0];
            resolve(insertedRows[0]);
          });
        }
      });
    }
  });
}

function findOrCreateUser(user) {
  return new Promise(function(resolve, reject) {
    if(cache.users[user.id]) { // we've already grabbed this user
      resolve(cache.users[user.id]);
    } else {
      db('user_cache').select('id').where({user_id: user.id}).then((rows) => {
        if(rows.length > 0) {
          winston.log('debug', 'Caching existing user',
            {userId: user.id, tag: user.tag, userCacheId: rows[0].id});
          cache.users[user.id] = rows[0].id;
          resolve(rows[0].id);
        } else {
          db('user_cache').insert({user_id: user.id, tag: user.tag}).then((insertedRows) => {
            winston.log('debug', 'Created new user record',
              {userId: user.id, tag: user.tag, userCacheId: insertedRows[0]});
            cache.users[user.id] = insertedRows[0];
            resolve(insertedRows[0]);
          });
        }
      });
    }
  });
}
