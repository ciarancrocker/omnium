'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();
const winston = require('winston');

require('dotenv').config();

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

const channelHandler = require('./event_handlers/channel_handler');
const messageHandler = require('./event_handlers/message_handler');
const presenceHandler = require('./event_handlers/presence_handler');

client.on('ready', () => {
  winston.log('info', 'Logged into Discord as %s', client.user.tag);
  // set a useful presence message
  client.user.setPresence({
    status: 'online',
    afk: false,
    game: {
      name: `Ask me for ${process.env.COMMAND_PREFIX}help`,
      url: '',
    },
  }).then(() => {
    winston.log('info', 'Presence set.');
  });
  winston.log('info', 'Using %s as prefix for commands',
    process.env.COMMAND_PREFIX);
});

client.on('voiceStateUpdate', channelHandler.handleVoiceStateUpdate);
client.on('message', messageHandler.dispatchMessage);
client.on('presenceUpdate', presenceHandler);

client.login(process.env.DISCORD_KEY);
