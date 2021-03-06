const db = require('../lib/database');
const logger = require('../lib/logging');
const userHelpers = require('../lib/user_helpers');

// this task will scan all guilds and all users, synchronise the database state for users, and if any user has not had
// their consent to store data requested under GDPR, the DM to do so is sent.
module.exports = async function(client) {
  logger.info('Running GDPR consent request task');
  const dmUsers = [];
  for (const guild of client.guilds.array()) {
    logger.debug(`Processing users for guild ${guild.name}`);
    await guild.fetchMembers();
    // get the users
    for (const member of guild.members.array()) {
      // if the user is not in the db, add them
      const {user} = member;
      if (user.bot) {
        continue;
      } // we don't care about bots
      const userDbCheck = await db.pool.query('SELECT * FROM users WHERE discord_id=$1', [user.id]);
      if (userDbCheck.rowCount == 0) {
        // need to add them to the database
        await db.pool.query('INSERT INTO users (discord_id, display_name) VALUES ($1, $2)', [user.id, user.tag]);
        // as this is a new user to us, we need to request consent
        dmUsers.push(user);
      } else {
        // check if we've requested consent before
        const userRecord = userDbCheck.rows[0];
        if (!userRecord.gdpr_consent_requested) {
          // we haven't, lets add them to the the list!
          dmUsers.push(user);
        }
      }
    }
  }

  logger.info(`Requesting user consent from ${dmUsers.length} users`);
  for (const user of dmUsers) {
    try {
      logger.debug(`Sending DM to ${user.tag} for GDPR`);
      await userHelpers.sendGdprRequest(user);
    } catch (e) {
      logger.error(`Failed to send GDPR consent request to ${user.tag}`);
    }
  }
};
