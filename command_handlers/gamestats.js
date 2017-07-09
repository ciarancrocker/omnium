const db_helpers = require('../database_helpers');
const text_helpers = require('../text_helpers');

module.exports = {
  bind: 'gamestats',
  callback: function(message) {
    const limit = text_helpers.getLimitFromMessage(message);
    db_helpers.getGlobalStatistics(limit)
      .then(text_helpers.makeGameTable)
      .then(table => text_helpers.paginateMessage(message, table));
  }
};
