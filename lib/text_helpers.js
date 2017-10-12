const winston = require('winston');

/**
 * Paginate a text message so it fits inside Discord's message character
 * limit
 *
 * @param {Object} message - Discord.js Message which is replied to
 * @param {string} textToSend - Message to be sent
 *
 * @return {Array} Array of the sent message IDs
 */
async function paginateMessage(message, textToSend) {
  const limit = 1950;
  if (textToSend.length <= limit) {
    const sentMessage = await message.reply('```' + textToSend + '```');
    return [sentMessage];
  }
  let split = Math.min(limit, textToSend.length);
  for (let i = limit; i > 0; i--) {
    if (textToSend[i] == '\n') {
      split = i;
      break;
    }
  }
  winston.log('debug', 'Splitting at %i', split);
  const sentMessage = await message.reply('```' + textToSend.slice(0, Math.min(split, textToSend.length)) + '```');
  const subseqeuentMessages = await paginateMessage(message, textToSend.slice(split));
  return [sentMessage, ...subseqeuentMessages];
}

/**
 * Paginate a text message so it fits inside Discord's message character
 * limit, and send it using the provided function
 *
 * @param {Function} sendFunction - Function to be called with the message to send
 * @param {string} textToSend - Message to be sent
 */
function paginateMessageToFunction(sendFunction, textToSend) {
  const limit = 1950;

  if (textToSend.length <= limit) {
    sendFunction('```' + textToSend + '```');
    return;
  }
  let split = Math.min(limit, textToSend.length);
  for (let i = limit; i > 0; i--) {
    if (textToSend[i] == '\n') {
      split = i;
      break;
    }
  }
  winston.log('debug', 'Splitting at %i', split);
  sendFunction('```' + textToSend.slice(0, Math.min(split, textToSend.length)) + '```');
  paginateMessageToFunction(sendFunction, textToSend.slice(split));
}

/**
 * Get arguments from the message string.
 *
 * @param {string} message - The message
 * @return {array} the arguments
 */
function getArgs(message) {
  return message.match(/"[^"]+"|'[^']+'|\S+/g);
}

/**
 * Get a result limit from the specified message, constraining it to values
 * that aren't obscene.
 *
 * @param {string} message - The message
 * @param {number} defaultLimit - A default limit to use if no value is set
 * @return {number} Constrained limit from the message
 */
function getLimitFromMessage(message, defaultLimit) {
  let limit = defaultLimit;
  const argv = message.split(' ');
  if (argv.length > 1) {
    // try and get a limit from the message
    if (!isNaN(argv[1])) {
      limit = parseInt(argv[1]);
    }
  }

  // set an upper bound on the limit based on what type of message it is
  if (message.member) { // sent from a text channel
    limit = Math.min(limit, 25);
  } else { // sent from a DM
    limit = limit; // if they want to get spammed, they can get spammed.
  }
  return limit;
}

module.exports = {
  paginateMessage,
  getArgs,
  getLimitFromMessage,
  paginateMessageToFunction,
};
