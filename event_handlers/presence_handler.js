const channelHandler = require('./channel_handler');
const database = require('../lib/database');
const logger = require('../lib/logging');
const userHelpers = require('../lib/user_helpers');

module.exports = async function(oldP, newP) {
  if (!process.env.FEAT_STATS) return;

  const {user} = newP;

  // don't interact with other bots
  if (user.bot) return;
  // GDPR compliance; ignore the user's actions if they have not consented
  const userConsented = await userHelpers.hasUserConsented(user);
  if (!userConsented) return;

  logger.log('debug', 'Presence event fired', {uid: user.id, old: oldP, new: newP});

  const oldActivities = oldP.activities || []; // oldP can be undefined/null here
  const newActivities = newP.activities;

  for (const oldActivity of oldActivities) {
    // first we check each oldActivity to see if it's in newActivities
    // if not the user has _stopped_ that activity in this event
    if (!newActivities.some((x) => x.name == oldActivity.name)) {
      logger.log('info', `User ${user.tag} stopped activity ${oldActivity.name}`);
      if (oldActivity.type == 'PLAYING') {
        const userId = await database.findOrCreateUser(user);
        const gameId = await database.findOrCreateGame(oldActivity.name);
        await database.endSession(userId, gameId);
      }
    }
  }

  for (const newActivity of newActivities) {
    // then we check each newActivity to see if it's oldActivities
    // if not the user has _started_ that activity in this event
    if (!oldActivities.some((x) => x.name == newActivity.name)) {
      logger.log('info', `User ${user.tag} started activity ${newActivity.name}`);
      if (newActivity.type == 'PLAYING') {
        const userId = await database.findOrCreateUser(user);
        const gameId = await database.findOrCreateGame(newActivity.name);
        await database.createNewSession(userId, gameId);
      }
    }
  }

  // if the user is in a voice channel we should probably update that channel too
  const channel = newP.member.voice.channel;
  if (channel) {
    logger.log('debug', `Requesting channel update for channel ${channel.name} (${channel.id}) due to presence update`);
    channelHandler.updateChannel(channel);
  }
};
