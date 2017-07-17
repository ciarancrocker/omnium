const winston = require('winston');

const dbHelpers = require('./database_helpers');

/**
 * Handle the presence update event emitted by Discord
 * This function begins the process of logging user game events
 *
 * @param {Object} before - User presence state before
 * @param {Object} after - User presence state after
 */
function handlePresenceUpdate(before, after) {
  if (
    before.presence != after.presence &&
    before.presence.game != after.presence.game
  ) {
    if (before.presence.game && !before.presence.game.url) {
      winston.log('info', 'User %s stopped playing %s', before.user.tag,
        before.presence.game.name);
      dbHelpers.addEvent(before.user, before.presence.game.name, 'end');
    }
    if (after.presence.game && !after.presence.game.url) {
      winston.log('info', 'User %s started playing %s', after.user.tag,
        after.presence.game.name);
      dbHelpers.addEvent(after.user, after.presence.game.name, 'begin');
    }
  }
}

module.exports.handlePresenceUpdate = handlePresenceUpdate;
