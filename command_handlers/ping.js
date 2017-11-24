if (process.env.FEAT_UTIL) {
  module.exports = {
    bind: 'ping',
    handler: async function(message) {
      message.reply('pong');
    },
    help: 'Ping-pong!',
  };
}
