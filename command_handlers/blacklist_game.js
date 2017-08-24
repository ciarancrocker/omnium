const database = require('../lib/database');
const winston = require('winston');

module.exports = {
  bind: 'blacklist_game',
  handler: async function(message) {
    const args = message.content.split(' ');
    const gameToBlacklist = args.slice(1).join(' ');
    const gameId = await database.findOrCreateGame(gameToBlacklist);
    await database.pool.query('UPDATE games SET visible = false WHERE id = $1',
      [gameId]);
    message.reply(`Blacklisted game ${gameToBlacklist} (${gameId})`);
    winston.log('info', 'Blacklisted game %s with id %s', gameToBlacklist,
      gameId);
  },
  administrative: true,
  help: 'Blacklist a game from being displayed in statistics',
};
