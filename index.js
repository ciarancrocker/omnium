'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();
const logger = require('./lib/logging');

require('dotenv').config();

// set up our event handlers
const channelHandler = require('./event_handlers/channel_handler');
const messageHandler = require('./event_handlers/message_handler');
const presenceHandler = require('./event_handlers/presence_handler');
const memberHandlers = require('./event_handlers/member_handlers');

// get our recurring functions
const serverStatsTask = require('./lib/server_statistics');

client.on('ready', async function() {
  logger.log('info', 'Logged into Discord as %s', client.user.tag);
  // set a useful presence message
  await client.user.setActivity(`Ask me for ${process.env.COMMAND_PREFIX}help`);
  logger.log('info', 'Using %s as prefix for commands', process.env.COMMAND_PREFIX);
  // fire off an update for all channels in case they've gotten inconsistent
  logger.log('info', 'Performing initial channel scan');
  client.guilds.array().forEach((guild) => channelHandler.updateChannelsForGuild(guild));

  // set up recurring functions now
  setInterval(() => serverStatsTask(client), 5 * 60 * 1000); // 5 minutes
});

client.on('voiceStateUpdate', channelHandler.handleVoiceStateUpdate);
client.on('message', messageHandler.dispatchMessage);
client.on('presenceUpdate', presenceHandler);

// stuff to handle GDPR
client.on('guildMemberAdd', memberHandlers.memberJoin);
client.on('guildMemberRemove', memberHandlers.memberLeave);

// If something bad happens, let the process manager restart us properly
client.on('disconnect', function(ev) {
  logger.log('debug', 'Discord.js websocket disconnected, terminating.', ev.reason);
  process.exit(1);
});
client.on('error', function(err) {
  logger.log('debug', 'Discord.js client emitted error event, terminating.', err);
  process.exit(1);
});

client.login(process.env.DISCORD_KEY);
