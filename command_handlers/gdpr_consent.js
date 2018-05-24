const db = require('../lib/database');

module.exports = {
  bind: 'gdpr_consent',
  handler: async function(message) {
    await db.pool.query('UPDATE users SET gdpr_consented=true WHERE discord_id=$1', [message.author.id]);
    await message.author.send('Your consent preference has been updated. Thank you!');
    await message.delete();
  },
  help: 'Allow the bot to store and process your personal information',
};
