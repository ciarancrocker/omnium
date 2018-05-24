const channelHandler = require('./channel_handler');
const database = require('../lib/database');
const userHelpers = require('../lib/user_helpers');
const winston = require('winston');

module.exports = async function(oldM, newM) {
  if (!process.env.FEAT_STATS) return;
  // don't interact with other bots
  if (oldM.user.bot) return;
  // GDPR compliance; ignore the user's actions if they have not consented
  const userConsented = await userHelpers.hasUserConsented(oldM.user);
  if (!userConsented) return;

  // if the game the member is playing has changed, update sessions accordingly
  if (!oldM.presence.equals(newM.presence)) {
    if (oldM.presence.game && newM.presence.game && oldM.presence.game.equals(newM.presence.game)) {
      // the presence has changed but the game has not
      return;
    }
    if (oldM.presence.game != null && oldM.presence.game.name != null && oldM.presence.game.type === 0) {
      // user finished session
      winston.log('info', 'User %s stopped playing %s', oldM.user.tag, oldM.presence.game.name);
      const userId = await database.findOrCreateUser(oldM.user);
      const gameId = await database.findOrCreateGame(oldM.presence.game.name);
      await database.endSession(userId, gameId);
    }
    if (newM.presence.game != null && newM.presence.game.name != null && newM.presence.game.type === 0) {
      // user starting session
      winston.log('info', 'User %s started playing %s', newM.user.tag, newM.presence.game.name);
      const userId = await database.findOrCreateUser(newM.user);
      const gameId = await database.findOrCreateGame(newM.presence.game.name);
      await database.createNewSession(userId, gameId);
    }
    // also update the voice channel the user is in if they're in one
    if (newM.voiceChannel) {
      channelHandler.updateChannel(newM.voiceChannel);
    }
    return;
  }
};
