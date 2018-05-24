const db = require('./database');
const winston = require('winston');

const gdprRequestBody = `In order to best make use of SGS Bot, we need to collect some personal data. For us to do \
that, you need to give us consent by replying to this message with \`!gdpr_consent\`.
For more information on how your personal data is stored and used, see the privacy policy at \
https://firestrike.co.uk/privacy/hosted_sgs.html`;

/**
 * Create a database entry for a member
 * @param {GuildMember} guildMember - the member to create an entry for
 * @return {Number} the internal ID for the user
 */
async function createDbUser(guildMember) {
  const {rows} = await db.pool.query('INSERT INTO users (discord_id, display_name) VALUES ($1, $2) RETURNING id', [guildMember.id, guildMember.user.tag]);
  return rows[0].id;
}

/**
 * Delete the database entry for a user if they have not consented to data being stored
 * @param {GuildMember} guildMember - the member to delete the entry for
 */
async function deleteDbUser(guildMember) {
  // get the user
  const {rows} = await db.pool.query('SELECT * FROM users WHERE discord_id=$1', [guildMember.id]);
  if (rows.length == 0) {
 return;
} // no user, somehow?
  const user = rows[0];
  if (!user.gdpr_consented) {
    // they have not consented to their data being stored, so we need to remove
    // them from our records
    await db.pool.query('DELETE FROM users WHERE id=$1', [user.id]);
    // this should cascade the deletes if postgres doesn't do something dumb
  }
}

/**
 * Send a GDPR consent request to a user
 * @param {User} user - The user to send the request to
 */
async function sendGdprRequest(user) {
  winston.debug(`Sending GDPR request to ${user.username}`);
  // send the message
  await user.send(gdprRequestBody);
  // update the record
  await db.pool.query('UPDATE users SET gdpr_consent_requested=true WHERE discord_id=$1', [user.id]);
}

/**
 * Convenience method for determining if a user has consented
 * @param {User} user - The user to check consent status for
 * @return {Boolean} Boolean indicating consent status
 */
async function hasUserConsented(user) {
  const {rows} = await db.pool.query('SELECT gdpr_consented FROM users WHERE discord_id=$1', [user.id]);
  if (rows.length == 0) {
    return false;
  }
  return rows[0].gdpr_consented;
}


module.exports = {
  createDbUser,
  deleteDbUser,
  sendGdprRequest,
  hasUserConsented,
};
