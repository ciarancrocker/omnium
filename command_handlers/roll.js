if (process.env.FEAT_UTIL) {
  module.exports = {
    bind: 'roll',
    handler: async function(message) {
      let sides = 6;

      const args = message.content.split(' ').slice(1);
      if (args.length > 0) {
        if (!isNaN(Number(args[0]))) {
          sides = Number(args[0]);
        }
      }

      // clamp value to 1000000
      sides = Math.min(1000000, sides);

      const roll = Math.floor((Math.random() * sides) + 1);
      message.reply(roll);
      return;
    },
    help: 'Rolls a dice with the specified number of sides (default: 6)',
  };
}
