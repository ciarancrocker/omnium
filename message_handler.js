const fs = require('fs');
const winston = require('winston');

// load all the command handlers
let commandHandlers = [];
fs.readdir('command_handlers', function(err, files) {
  files.forEach(function(file) {
    if (file.match(/^.+\.js$/)) {
      const commHandler = require(`./command_handlers/${file}`);
      if (
        typeof commHandler === 'object' &&
        commHandler.bind && typeof commHandler.bind === 'string' &&
        commHandler.callback && typeof commHandler.callback === 'function'
      ) {
        winston.log('info', 'Registered command %s from file %s',
          commHandler.bind, file);
        commandHandlers.push(commHandler);
      }
    }
  });
});

module.exports.dispatchMessage = function(message) {
  // filter out messages that aren't commands for us
  if (message.content[0] != process.env.COMMAND_PREFIX) return;

  // filter to target handlers
  const targetCommand = message.content.slice(1).split(' ')[0];
  const possibleHandlers =
    commandHandlers.filter((handler) => handler.bind == targetCommand);

  if (possibleHandlers.length == 0) { // command not found
    winston.log('info', 'Command %s from user %s not found', targetCommand,
      message.author.tag);
    return;
  }

  // dispatch message to designated handler
  winston.log('info', 'Dispatched command %s for user %s', targetCommand,
    message.author.tag);
  possibleHandlers[0].callback(message);
};

