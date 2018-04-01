const util = require('util');
const winston = require('winston');

const DiscordLogger = winston.transports.DiscordLogger = function(options) {
  this.name = 'discordLogger';
  this.level = options.level || 'info';
  if (!options.client || !options.channelId) {
    throw new Error('Must specify client and channel ID');
  }
  this.client = options.client;
  this.channelId = options.channelId;
};

util.inherits(DiscordLogger, winston.Transport);

DiscordLogger.prototype.log = function(level, msg, meta, callback) {
  if (!this.channel) {
    this.channel = this.client.channels.get(this.channelId);
    // if we still haven't got it, we'll just fail silently
    if (!this.channel) {
 return void callback(null, false);
}
  }

  this.channel.send(`${new Date().toISOString()} - ${level} - ${msg}`).then(() => {
    callback(null, true);
  }).catch(() => {
    callback(null, false);
  });
};

module.exports = DiscordLogger;
