module.exports = {
  bind: 'ping',
  handler: function(message) {
    message.reply('pong');
  },
  help: 'Ping-pong!',
};
