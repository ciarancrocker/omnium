const messageHelpers = require('../lib/message_helpers');

module.exports = {
  bind: 'purge',
  handler: async function(message) {
    const args = message.content.split(' ').slice(1);

    // the first argument is non-optional, fail if not provided
    if (args.length < 1) {
      await messageHelpers.sendError(message,
        'You must specify a number of messages to be deleted');
      return;
    }

    const n = Number(args[0]);
    if (isNaN(n)) {
      await messageHelpers.sendError(message, `Invalid argument for n: ${n}`);
      return;
    }

    // the user must be in a channel for this command to be useful
    if (!message.channel) {
      await messageHelpers.sendError(message,
        `You must send this command from a channel for it to be useful`);
      return;
    }

    // delete the messages
    await message.channel.bulkDelete(n);
    await message.delete();
  },
  help: 'Purge the last <n> messages from the channel this command' +
  ' is invoked in.',
  administrative: true,
};
