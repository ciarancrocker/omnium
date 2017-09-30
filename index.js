'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();
const winston = require('winston');

require('dotenv').config();

// Configure logging to file and console
// Developers can then just `require('winston')` to log in their modules
winston.configure({
  transports: [
    new (winston.transports.Console)({
      level: 'debug',
      timestamp: true,
    }),
    new (winston.transports.File)({
      filename: 'sgs_bot.log',
    }),
  ],
});

// set up our event handlers
const channelHandler = require('./event_handlers/channel_handler');
const messageHandler = require('./event_handlers/message_handler');
const presenceHandler = require('./event_handlers/presence_handler');

client.on('ready', async function() {
  winston.log('info', 'Logged into Discord as %s', client.user.tag);
  // set a useful presence message
  await client.user.setPresence({
    status: 'online',
    afk: false,
    activity: {
      name: `Ask me for ${process.env.COMMAND_PREFIX}help`,
    },
  });
  winston.log('info', 'Using %s as prefix for commands',
    process.env.COMMAND_PREFIX);
  // fire off an update for all channels in case they've gotten inconsistent
  winston.log('info', 'Performing initial channel scan');
  client.guilds.array().forEach((guild) => channelHandler.updateChannelsForGuild(guild));
});

client.on('voiceStateUpdate', channelHandler.handleVoiceStateUpdate);
client.on('message', messageHandler.dispatchMessage);
client.on('presenceUpdate', presenceHandler);

// If something bad happens, let the process manager restart us properly
client.on('disconnect', function() {
  process.exit(1);
});
client.on('error', function() {
  process.exit(1);
});

client.login(process.env.DISCORD_KEY);
