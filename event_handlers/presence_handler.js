const database = require('../lib/database');
const winston = require('winston');

module.exports = async function(oldM, newM) {
  winston.debug(JSON.stringify(oldM.presence));
  winston.debug(JSON.stringify(newM.presence));
  // if the game the member is playing has changed, update sessions accordingly
  if (!oldM.presence.equals(newM.presence)) {
    if (oldM.presence.activity != null && oldM.presence.activity.name != null) {
      // user finished session
      winston.log('info', 'User %s stopped playing %s', oldM.user.tag,
        oldM.presence.activity.name);
      const userId = await database.findOrCreateUser(oldM.user);
      const gameId =
        await database.findOrCreateGame(oldM.presence.activity.name);
      await database.endSession(userId, gameId);
    }
    if (newM.presence.activity != null && newM.presence.activity.name != null) {
      // user starting session
      winston.log('info', 'User %s started playing %s', newM.user.tag,
        newM.presence.activity.name);
      const userId = await database.findOrCreateUser(newM.user);
      const gameId =
        await database.findOrCreateGame(newM.presence.activity.name);
      await database.createNewSession(userId, gameId);
    }
    return;
  }
};
