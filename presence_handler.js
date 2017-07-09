const winston = require('winston');

const db_helpers = require('./database_helpers');

function handlePresenceUpdate(before, after) {
  if(before.presence != after.presence && before.presence.game != after.presence.game) {
    if(before.presence.game && !before.presence.game.url) {
      winston.log('info', 'User %s stopped playing %s', before.user.tag, before.presence.game.name);
      db_helpers.addEvent(before.user.id, before.presence.game.name, 'end');
    }
    if(after.presence.game && !after.presence.game.url) {
      winston.log('info', 'User %s started playing %s', after.user.tag, after.presence.game.name);
      db_helpers.addEvent(after.user.id, after.presence.game.name, 'begin');
    }
  }
}

module.exports.handlePresenceUpdate = handlePresenceUpdate;
