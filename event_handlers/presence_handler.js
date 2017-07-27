const database = require('../lib/database');
const winston = require('winston');

module.exports = async function(oldM, newM) {
  // if the game the member is playing has changed, update sessions accordingly
  if (!oldM.presence.equals(newM.presence)) {
    if (oldM.presence.game != null && oldM.presence.game.name != null
      && !oldM.presence.game.streaming) {
      // user finished session
      winston.log('info', 'User %s stopped playing %s', oldM.user.tag,
        oldM.presence.game.name);
      const userId = await database.findOrCreateUser(oldM.user);
      const gameId = await database.findOrCreateGame(oldM.presence.game.name);
      await database.endSession(userId, gameId);
    }
    if (newM.presence.game != null && newM.presence.game.name != null
      && !newM.presence.game.streaming) {
      // user starting session
      winston.log('info', 'User %s started playing %s', newM.user.tag,
        newM.presence.game.name);
      const userId = await database.findOrCreateUser(newM.user);
      const gameId = await database.findOrCreateGame(newM.presence.game.name);
      await database.createNewSession(userId, gameId);
    }
    return;
  }
};
