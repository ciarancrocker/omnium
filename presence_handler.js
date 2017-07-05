const winston = require('winston');

const db = require('./database');

const gameCache = {};

function addEvent(user_id, game, event) {
  // grab the game ID for the game we're adding.
  findOrCreateGame(game)
    .then(game_id => db('GameLog').insert({ user_id, event, game_id }))
    .then(() => {
      winston.log('debug', 'Logged presence change event', { user_id, game, event });
    }).catch(err => {
      winston.log('error', 'Failed to log presence change event, aborting', err);
    });
}

function handlePresenceUpdate(before, after) {
  if(before.presence != after.presence || before.presence.game != after.presence.game) {
    if(before.presence.game && !before.presence.url) {
      winston.log('info', 'User %s stopped playing %s', before.user.tag, before.presence.game.name);
      addEvent(before.user.id, before.presence.game.name, 'end');
    }
    if(after.presence.game && !after.presence.url) {
      winston.log('info', 'User %s started playing %s', after.user.tag, after.presence.game.name);
      addEvent(after.user.id, after.presence.game.name, 'begin');
    }
  }
}

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

module.exports.handlePresenceUpdate = handlePresenceUpdate;
