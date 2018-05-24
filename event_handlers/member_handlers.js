const userHelpers = require('../lib/user_helpers');

/**
 * Event handler for a member joining
 *
 * @param {GuildMember} member - the member joining
 */
async function memberJoin(member) {
  // when a member joins make a record for them
  await userHelpers.createDbUser(member);
  // then send them a GDPR request
  await userHelpers.sendGdprRequest(member.user);
}

/**
 * Event handler for a member leaving
 *
 * @param {GuildMember} member - the member leaving
 */
async function memberLeave(member) {
  await userHelpers.deleteDbUser(member);
}

module.exports = {
  memberJoin,
  memberLeave,
};
