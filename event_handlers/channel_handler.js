const db = require('../lib/database');
const logger = require('../lib/logging');

/**
 * Get the modal element in an array
 *
 * @param {*[]} arr -  Array to find mode of
 * @return {*} Modal element
 */
function mode(arr) {
  return arr.sort((a, b) =>
    arr.filter((v) => v===a).length -
    arr.filter((v) => v===b).length,
  ).pop();
}

/**
 * Update the name of a channel based on it's members presence
 *
 * @param {Channel} channel - The channel to be updated
 */
async function updateChannel(channel) {
  if (!process.env.FEAT_CHANNELS) {
    return;
  }
  // see if this is a channel we're managing
  const channelQuery = await db.pool.query('SELECT * FROM channels WHERE discord_id = $1', [channel.id]);
  if (channelQuery.rowCount > 0) { // yes, we are managing it
    const channelMembers = channel.members.array();
    let channelName = channelQuery.rows[0].name;
    if (channelMembers.length > 0) {
      const activities = channelMembers.map((m) => m.presence.activities)
          .reduce((a, b) => Array.isArray(b) ? [...a, ...b] : a, [])
          .filter((x) => x.type == 'PLAYING')
          .map((x) => x.name);
      logger.log('debug', `Found ${activities.length} valid candidate activities`, activities);
      if (activities.length > 0) {
        const modalGame = mode(activities);
        channelName = `${channelName} (${modalGame})`;
      }
    }
    if (channelName == channel.name) {
      logger.log('debug', `Skipping update for "${channel.name}" (no change in name)`);
    } else {
      setChannelName(channel, channelName);
    }
  }
}

/**
 * Wrapper function to set a channel's name
 *
 * @param {Channel} channel - Channel whose name should be changed
 * @param {string} newName - New name for specified channel
 * @return {Promise} Promise for setting the name
 */
function setChannelName(channel, newName) {
  const oldName = channel.name;
  return channel.setName(newName).then(() => {
    logger.log('info', `Channel changed from "${oldName}" to "${newName}"`);
  }).catch((err) => {
    logger.log('error', `Error changing channel name for channel "${oldName}" (${channel.id})`);
  });
}

/**
 * Convenience function for generating lists for temporary channel provisioning
 *
 * @param {Guild} guild - The guild for which channel management is taking place
 *
 * @return {Object} object with required arrays
 */
async function generateChannelLists(guild) {
  const managedChannels = (await db.pool.query('SELECT * FROM channels')).rows;
  const emptyManagedChannels = managedChannels.filter((mch) =>
    guild.channels.cache.get(mch.discord_id).members.array().length == 0);
  const emptyTemporaryChannels = emptyManagedChannels.filter((emch) => emch.temporary).reverse();
  return {managedChannels, emptyManagedChannels, emptyTemporaryChannels};
}

/**
 * Handle provisioning and deprovisioning of temporary channels in a guild based
 * on channel occupancy.
 *
 * @param {Guild} guild - The Guild for which channel management should take
 *   place
 */
async function provisionTemporaryChannels(guild) {
  if (!process.env.FEAT_CHANNELS) {
    return;
  }

  // first lets figure out if we need a temporary channels
  let {managedChannels, emptyManagedChannels, emptyTemporaryChannels} = await generateChannelLists(guild);

  if (managedChannels.length == 0) {
    logger.log('debug', 'No managed channels are configured, skipping processing.');
    return;
  }

  logger.log('debug', `${emptyManagedChannels.length} empty managed channels`);
  if (emptyManagedChannels.length == 0) {
    // we need to make a temporary channel
    // first get the current newest channel for it's position
    const newestChannelId = await db.getNewestChannelId();
    const newestChannel = guild.channels.cache.get(newestChannelId);

    // then we create the channel
    const channelNumber = await db.getNextChannelNumber();
    const channelName = `Game Room ${channelNumber}`;
    logger.log('debug', `Creating new temporary channel "${channelName}"`);
    // create it in discord
    const newChannel = await guild.channels.create(channelName, {
      type: 'voice',
      parent: newestChannel.parent,
      position: newestChannel.position,
    });
    // insert it in the db
    await db.createChannel(newChannel, channelNumber);
  } else if (emptyManagedChannels.length > 1 && emptyTemporaryChannels.length > 0) {
    // we might need to delete some temporary channels
    logger.log('debug', 'Scanning for empty temporary channels');
    while (emptyManagedChannels.length > 1) {
      // get and delete the newest temporary channel
      const channelToBeDeleted = emptyTemporaryChannels[0];
      logger.log('debug', `Deleting temporary channel ${channelToBeDeleted.name}`);
      await guild.channels.cache.get(channelToBeDeleted.discord_id).delete();
      await db.deleteChannel(channelToBeDeleted.discord_id);
      // regenerate the lists
      const newValues = await generateChannelLists(guild);
      managedChannels = newValues.managedChannels;
      emptyManagedChannels = newValues.emptyManagedChannels;
      emptyTemporaryChannels = newValues.emptyTemporaryChannels;
    }
  }
}

/**
 * Handle the voice state update generated by Discord.js
 *
 * @param {VoiceState} before - Member before the update
 * @param {VoiceState} after - Member after the update
 */
async function handleVoiceStateUpdate(before, after) {
  if (!process.env.FEAT_CHANNELS) {
    return;
  }
  // do renaming
  if (before.channel != null) {
    updateChannel(before.channel);
  }
  if (after.channel != null) {
    updateChannel(after.channel);
  }

  // handle join order recording
  if (before.channel != after.channel) {
    if (before.channel) {
      await db.leaveChannel(before.id);
      logger.log('info', `${before.member.user.tag} left channel ${before.channel.name}`);
    }
    if (after.channel) {
      await db.joinChannel(after.channel.id, after.id);
      logger.log('info', `${after.member.user.tag} joined channel ${after.channel.name}`);
    }
  }

  // do temporary channels
  provisionTemporaryChannels(after.guild);
}

/**
 * Update all channels for the given guild
 *
 * @param {Guild} guild - Guild to be updated
 */
function updateChannelsForGuild(guild) {
  if (!process.env.FEAT_CHANNELS) {
    return;
  }
  logger.log('info', `Updating channels for guild ${guild.name}`, guild.name);
  if (guild.available) {
    const channels = guild.channels.cache.array();
    for (const channel of channels) {
      updateChannel(channel);
    }
  }
}

module.exports.updateChannel = updateChannel;
module.exports.updateChannelsForGuild = updateChannelsForGuild;
module.exports.handleVoiceStateUpdate = handleVoiceStateUpdate;
