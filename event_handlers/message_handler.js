const fs = require('fs');
const path = require('path');
const Table = require('ascii-table');
const winston = require('winston');

const db = require('../lib/database');
const textHelpers = require('../lib/text_helpers');

// load all the command handlers
let commandHandlers = [];
const commandHandlerLoadPath = path.resolve(process.cwd(),
  './command_handlers');
winston.log('debug', 'Loading commands from %s', commandHandlerLoadPath);
fs.readdir(commandHandlerLoadPath, function(err, files) {
  files.forEach(function(file) {
    if (file.match(/^.+\.js$/)) {
      const commHandler = require(path.resolve(commandHandlerLoadPath, file));
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

  // special help command
  commandHandlers.push({
    bind: 'help',
    handler: async function(message) {
      let userIsAdmin = false;
      if (message.guild) {
        userIsAdmin = await db.isUserAuthenticated(message.member);
      }

      const table = new Table();
      table.setHeading('Command', 'Help');
      table.setTitle('Help for ciarancrocker/sgs_bot');
      for (let handler of commandHandlers) {
        if (!handler.administrative || userIsAdmin) {
          if (handler.help) {
            table.addRow(handler.bind, handler.help);
          } else {
            table.addRow(handler.bind, 'No help provided');
          }
        }
      };
      textHelpers.paginateMessage(message, table.toString());
    },
    help: 'This command, you donut.',
  });

  // sort the list just so help is nice and pretty
  commandHandlers.sort(function(a, b) {
    if (a.bind < b.bind) {
      return -1;
    } else if (a.bind > b.bind) {
      return 1;
    } else {
      return 0;
    }
  });
});

/**
 * Generate a static handler to reply with the specified text
 *
 * @param {string} text Text to return
 *
 * @return {Object} Generated static handler
 */
function generateStaticHandler(text) {
  return {
    handler: async function(message) {
      await message.reply(text);
    },
  };
}

module.exports.dispatchMessage = async function(message) {
  // don't interact with other bots
  if (message.member.bot) return;

  // filter out messages that aren't commands for us
  if (message.content[0] != process.env.COMMAND_PREFIX) return;

  // filter to target handlers
  const targetCommand = message.content.slice(1).split(' ')[0];
  const possibleHandlers =
    commandHandlers.filter((handler) => handler.bind == targetCommand);

  let handler = undefined;

  if (possibleHandlers.length == 0) { // no rich commands, look for statics
    const staticCommand = await db.getStaticCommand(targetCommand);
    if (staticCommand) { // there's a static
      handler = generateStaticHandler(staticCommand.return_text);
    } else { // command not found
      winston.log('info', 'Command %s from user %s not found', targetCommand,
        message.author.tag);
      return;
    }
  } else { // use rich command
    handler = possibleHandlers[0];
  }

  // validate permissions if the command is for administrators only
  if (handler.administrative) {
    if (!message.member) {
      // needs to be run from a server
      winston.log('info', 'Denied user %s access to command %s',
        message.author.tag, targetCommand);
      message.reply('You need to run this command from within a server');
      return;
    }
    const authResult = await db.isUserAuthenticated(message.member);
    if (!authResult) { // the user isn't permitted to run this command
      message.member.send('Access denied; nice try kiddo.');
      winston.log('info', 'Denied user %s access to command %s',
        message.author.tag, targetCommand);
      return;
    }
  }

  // dispatch message to designated handler
  winston.log('info', 'Dispatched command %s for user %s', targetCommand,
    message.author.tag);
  handler.handler(message);
  db.logEvent('command', {name: targetCommand, args: message.content.slice(1).split(' ').slice(1)});
};

