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
  let gameId;
  let userCacheId;
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
      db('games').select('id').where({name: gameName}).then((result) => {
        if (result.rowCount > 0) {
          winston.log('debug', 'Caching existing game',
            {gameName, gameId: result[0]});
          cache.games[gameName] = result[0];
          resolve(result[0]);
        } else {
          db('games').returning('id').insert({name: gameName})
            .then((result) => {
              winston.log('debug', 'Created new game record',
                {gameName, gameId: result[0]});
              cache.games[gameName] = result[0];
              resolve(result[0]);
            });
        }
      });
    }
  });
}

/**
 * Get the id for provided user, or create one if not found.
 *
 * @param {User} user - User to search for
 * @return {number} ID of specified user
 */
function findOrCreateUser(user) {
  return new Promise(function(resolve, reject) {
    if (cache.users[user.id]) { // we've already grabbed this user
      resolve(cache.users[user.id]);
    } else {
      db('user_cache').select('id').where({user_id: user.id}).then((result) => {
        if (result.rowCount > 0) {
          winston.log('debug', 'Caching existing user',
            {userId: user.id, tag: user.tag, userCacheId: result[0]});
          cache.users[user.id] = result[0];
          resolve(result[0]);
        } else {
          db('user_cache').returning('id')
            .insert({user_id: user.id, tag: user.tag})
            .then((result) => {
              winston.log('debug', 'Created new user record',
                {userId: user.id, tag: user.tag, userCacheId: result[0]});
              cache.users[user.id] = result[0];
              resolve(result[0]);
            });
        }
      });
    }
  });
}
