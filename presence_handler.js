const winston = require('winston');

const db = require('./database');

function addEvent(user_id, game, event) {
  db('GameLog').insert({ user_id, game, event }).then(() => {
    winston.log('debug', 'Logged presence change event', { user_id, game, event });
  }).catch(err => {
    winston.log('error', 'Failed to log presence change event, aborting', err);
  });
}

function handlePresenceUpdate(before, after) {
  if(before.presence != after.presence || before.presence.game != after.presence.game) {
    if(before.presence.game) {
      winston.log('info', 'User %s stopped playing %s', before.user.tag, before.presence.game.name);
      addEvent(before.user.id, before.presence.game.name, 'end');
    }
    if(after.presence.game) {
      winston.log('info', 'User %s started playing %s', after.user.tag, after.presence.game.name);
      addEvent(after.user.id, after.presence.game.name, 'begin');
    }
  }
}

module.exports.handlePresenceUpdate = handlePresenceUpdate;
