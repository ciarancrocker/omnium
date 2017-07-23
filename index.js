'use strict';

const Discord = require('discord.js');
const client = new Discord.Client();
const winston = require('winston');

require('dotenv').config();

const channelHandler = require('./channel_handler');
const messageHandler = require('./message_handler');
const presenceHandler = require('./presence_handler');

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

client.on('ready', () => {
  winston.log('info', 'Logged into Discord as %s', client.user.tag);
  // set creepy presence
  client.user.setPresence({
    status: 'online',
    afk: false,
    game: {
      name: '100% fresh dank memes',
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
