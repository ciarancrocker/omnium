module.exports = {
  bind: 'task',
  handler: async function(message) {
    const argv = message.content.split(' ');
    if (argv.length < 2) {
      const errorMessage = await message.reply('No task specified.');
      message.delete({timeout: 5000});
      errorMessage.delete({timeout: 5000});
      return;
    }
    const taskName = argv[1];
    try {
      const task = require(`../tasks/${taskName}`);
      await message.reply(`Running task ${taskName}`);
      await task(message.client);
      await message.reply('Task run completed successfully');
    } catch (e) {
      const errorMessage = await message.reply('Error running task, see logs for information');
      message.delete({timeout: 5000});
      errorMessage.delete({timeout: 5000});
      return;
    }
  },
  help: 'Run a predefined task',
  administrative: true,
};
