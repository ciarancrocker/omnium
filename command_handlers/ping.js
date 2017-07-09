module.exports = {
  bind: 'ping',
  callback: function(message) {
    message.reply('pong');
  }
}
