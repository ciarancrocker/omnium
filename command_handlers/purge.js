const messageHelpers = require('../lib/message_helpers');
const logger = require('../lib/logging');

if (process.env.FEAT_UTIL) {
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
      try {
        await message.channel.bulkDelete(n);
      } catch (e) {
        await message.author.send('The bulk delete failed, likely due to requesting too much be deleted. Choose a smaller number, or inspect the error log for more information.');
        logger.log('info', 'Call to bulk delete threw an error.', {e});
        await message.delete();
      }
    },
    help: 'Purge the last <n> messages from the channel this command' +
    ' is invoked in.',
    administrative: true,
  };
}
