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
        commHandler.handler && typeof commHandler.handler === 'function'
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
  const handler = possibleHandlers[0];

  // validate permissions if the command is for administrators only
  if (handler.administrative) {
    const memberRoles = message.member.roles.array();
    if (memberRoles.filter((role) => role.id == process.env.ADMIN_ROLE)
      .length == 0) {
      winston.log('info', 'Denied user %s access to command %s',
        message.author.tag, targetCommand);
      return;
    }
  }

  // dispatch message to designated handler
  winston.log('info', 'Dispatched command %s for user %s', targetCommand,
    message.author.tag);
  possibleHandlers[0].handler(message);
};

