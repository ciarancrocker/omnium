const winston = require('winston');

/**
 * Paginate a text message so it fits inside Discord's message character
 * limit
 *
 * @param {Object} message - Discord.js Message which is replied to
 * @param {string} textToSend - Message to be sent
 */
function paginateMessage(message, textToSend) {
  const limit = 1950;
  if (textToSend.length <= limit) {
    message.reply(textToSend, {code: true});
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
  message.reply(
    textToSend.slice(0, Math.min(split, textToSend.length)),
    {code: true}
  );
  paginateMessage(message, textToSend.slice(split));
}

module.exports = {
  paginateMessage,
};
