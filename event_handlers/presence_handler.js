const channelHandler = require('./channel_handler');
const database = require('../lib/database');
const logger = require('../lib/logging');
const userHelpers = require('../lib/user_helpers');

module.exports = async function(oldM, newM) {
  if (!process.env.FEAT_STATS) return;
  // don't interact with other bots
  if (oldM.user.bot) return;
  // GDPR compliance; ignore the user's actions if they have not consented
  const userConsented = await userHelpers.hasUserConsented(oldM.user);
  if (!userConsented) return;

  logger.log('debug', 'Presence event fired', {uid: oldM.id, old: oldM.presence, new: newM.presence});

  // if the game the member is playing has changed, update sessions accordingly
  if (!oldM.presence.equals(newM.presence)) {
    logger.log('debug', 'Presence has changed', {uid: oldM.id});
    if (oldM.presence.game && newM.presence.game && oldM.presence.game.equals(newM.presence.game)) {
      logger.log('debug', 'Presence changed but game did not.', {uid: oldM.id, old: oldM.presence.game, new: newM.presence.game});
      // the presence has changed but the game has not
      return;
    }
    if (oldM.presence.game != null && oldM.presence.game.name != null && oldM.presence.game.type === 0) {
      // user finished session
      logger.log('info', `User ${oldM.user.tag} stopped playing ${oldM.presence.game.name}`);
      const userId = await database.findOrCreateUser(oldM.user);
      const gameId = await database.findOrCreateGame(oldM.presence.game.name);
      await database.endSession(userId, gameId);
    }
    if (newM.presence.game != null && newM.presence.game.name != null && newM.presence.game.type === 0) {
      // user starting session
      logger.log('info', `User ${newM.user.tag} started playing ${newM.presence.game.name}`);
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
