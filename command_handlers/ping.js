if (process.env.FEAT_UTIL) {
  module.exports = {
    bind: 'ping',
    handler: async function(message) {
      if (Math.floor(Math.random() * 100) === 99) {
        message.reply('nah fam');
      } else {
        message.reply('pong');
      }
    },
    help: 'Ping-pong!',
  };
}
