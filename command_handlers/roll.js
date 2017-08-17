const handler = async function(message) {
  let sides = 6;

  const args = message.content.split(' ').slice(1);
  if (args.length > 0) {
    if (!isNaN(Number(args[0]))) {
      sides = Number(args[0]);
    }
  }

  const roll = Math.floor((Math.random() * sides) + 1);
  message.reply(roll);
  return;
};

module.exports = {
  bind: 'roll',
  handler: handler,
  help: 'Rolls a dice with the specified number of sides (default: 6)',
};
