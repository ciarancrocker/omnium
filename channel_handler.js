const winston = require('winston');

const mapping = {
  "265932015713386516": "Game Room 1",
  "223040412636545024": "Game Room 2",
  "223826583444520960": "Game Room 3",
  "224614041740378113": "Game Room 4",
};

function mode(arr){
  return arr.sort((a,b) =>
    arr.filter(v => v===a).length
    - arr.filter(v => v===b).length
  ).pop();
}

function updateChannel(channel) {
  if(mapping[channel.id]) {
    const channelMembers = channel.members.array();
    let newChannelName = mapping[channel.id];
    if(channelMembers.length > 0) {
      const presences = channelMembers.map(gm => gm.presence.game).filter(o => o).map(game => game.name);
      if(presences.length > 0) {
        const modalGame = mode(presences);
        newChannelName = `${mapping[channel.id]} (${modalGame})`;
      }
    }
    if(newChannelName == channel.name) {
      winston.log('debug', 'Skipping update for "%s" (no change in name)', channel.name);
    } else {
      setChannelName(channel, newChannelName);
    }
  }
}

function setChannelName(channel, newName) {
  const oldName = channel.name;
  return channel.setName(newName).then(() => {
    winston.log('info', 'Channel changed from "%s" to "%s"', oldName, newName);
  }).catch(err => {
    winston.log('error', 'Error changing channel name for channel "%s" (%d)', oldName, channel.id);
  });
}

function handleVoiceStateUpdate(before, after) {
  if (before.voiceChannelID != null) {
    updateChannel(before.guild.channels.find(ch => ch.id == before.voiceChannelID));
  }
  if (after.voiceChannelID != null) {
    updateChannel(before.guild.channels.find(ch => ch.id == after.voiceChannelID));
  }
}

module.exports.handleVoiceStateUpdate = handleVoiceStateUpdate;
