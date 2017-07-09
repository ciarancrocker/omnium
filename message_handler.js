const fs = require('fs');
const moment = require('moment');
const Table = require('ascii-table');
const winston = require('winston');
const db = require('./database');
const db_helpers = require('./database_helpers');

// load all the command handlers
let command_handlers = [];
fs.readdir('command_handlers', function(err, files) {
  files.forEach(function(file) {
    if(file.match(/^.+\.js$/)) {
      const comm_handler = require(`./command_handlers/${file}`);
      if (
        typeof comm_handler === 'object' &&
        comm_handler.bind && typeof comm_handler.bind === 'string' &&
        comm_handler.callback && typeof comm_handler.callback === 'function'
      ) {
        winston.log('info', 'Registered command %s from file %s', comm_handler.bind, file);
        command_handlers.push(comm_handler);
      }
    }
  });
});

module.exports.dispatchMessage = function(message) {
  // filter out messages that aren't commands for us
  if(message.content[0] != process.env.COMMAND_PREFIX) { return; }

  // filter to target handlers
  const target_command = message.content.slice(1).split(' ')[0];
  const possible_handlers = command_handlers.filter(handler => handler.bind == target_command);
  if(possible_handlers.length == 0) { // command not found
    winston.log('info', 'Command %s from user %s not found', target_command, message.author.tag);
    return;
  }

  // dispatch message to designated handler
  winston.log('info', 'Dispatched command %s for user %s', target_command, message.author.tag);
  possible_handlers[0].callback(message);
}

