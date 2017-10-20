const channelHandler = require('./channel_handler');
const database = require('../lib/database');
const winston = require('winston');

module.exports = async function(oldM, newM) {
  // don't interact with other bots
  if (oldM.user.bot) return;

  // if the game the member is playing has changed, update sessions accordingly
  if (!oldM.presence.equals(newM.presence)) {
    if (oldM.presence.activity != null && oldM.presence.activity.name != null && !oldM.presence.activity.url) {
      // user finished session
      winston.log('info', 'User %s stopped playing %s', oldM.user.tag,
        oldM.presence.activity.name);
      const userId = await database.findOrCreateUser(oldM.user);
      const gameId =
        await database.findOrCreateGame(oldM.presence.activity.name);
      await database.endSession(userId, gameId);
    }
    if (newM.presence.activity != null && newM.presence.activity.name != null && !newM.presence.activity.url) {
      // user starting session
      winston.log('info', 'User %s started playing %s', newM.user.tag,
        newM.presence.activity.name);
      const userId = await database.findOrCreateUser(newM.user);
      const gameId =
        await database.findOrCreateGame(newM.presence.activity.name);
      await database.createNewSession(userId, gameId);
    }
    // also update the voice channel the user is in if they're in one
    if (newM.voiceChannel) {
      channelHandler.updateChannel(newM.voiceChannel);
    }
    return;
  }
};
