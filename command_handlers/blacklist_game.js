const database = require('../lib/database');
const logger = require('../lib/logging');

if (process.env.FEAT_STATS) {
  module.exports = {
    bind: 'blacklist_game',
    handler: async function(message) {
      const args = message.content.split(' ');
      const gameToBlacklist = args.slice(1).join(' ');
      const gameId = await database.findOrCreateGame(gameToBlacklist);
      await database.pool.query('UPDATE games SET visible = false WHERE id = $1', [gameId]);
      message.reply(`Blacklisted game ${gameToBlacklist} (${gameId})`);
      logger.log('info', `Blacklisted game ${gameToBlacklist} with id ${gameId}`);
    },
    administrative: true,
    help: 'Blacklist a game from being displayed in statistics',
  };
}
