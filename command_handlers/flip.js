const handler = async function(message) {
  const flip = (Math.floor(Math.random() * 2) == 0) ? 'Heads' : 'Tails';
  message.reply(`${flip}!`);
  return;
};

module.exports = {
  bind: 'flip',
  handler: handler,
  help: 'Flips a virtual coin',
};
