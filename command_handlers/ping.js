module.exports = {
  bind: 'ping',
  handler: function(message) {
    message.reply('pong');
  },
};
