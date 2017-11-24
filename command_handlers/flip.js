if (process.env.FEAT_UTIL) {
  module.exports = {
    bind: 'flip',
    handler: async function(message) {
      const flip = (Math.floor(Math.random() * 2) == 0) ? 'Heads' : 'Tails';
      message.reply(`${flip}!`);
      return;
    },
    help: 'Flips a virtual coin',
  };
}
