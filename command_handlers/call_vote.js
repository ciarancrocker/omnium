const db = require('../lib/database');
const messageHelpers = require('../lib/message_helpers');
const voting = require('../lib/voting');

module.exports = {
  bind: 'call_vote',
  handler: async function(message) {
    // validate vote reason and target roles
    const voteReason = message.content.split(' ').slice(2).join(' ');
    const mentionedRoles = message.mentions.roles.array();

    if (mentionedRoles.length != 1) {
      await messageHelpers.sendError(message, 'Invalid or no roles specified. Specify one role only.');
      return;
    }
    const targetRole = mentionedRoles[0];

    if (voteReason.length == 0) {
      await messageHelpers.sendError(message, 'You must specify a vote reason.');
      return;
    }

    // build rich message
    const voteMessage = await message.channel.send({
      embed: {
        title: 'SGS Bot Vote',
        fields: [
          {
            name: 'Called by',
            value: message.author.username,
            inline: true,
          },
          {
            name: 'Reason',
            value: voteReason,
            inline: false,
          },
        ],
      },
    });

    // add reactions
    await voteMessage.react(voting.emoji.for);
    await voteMessage.react(voting.emoji.abstain);
    await voteMessage.react(voting.emoji.against);

    // create record in database
    await db.createVote(voteReason, targetRole.id, voteMessage.id);

    // setup interval
    const intervalId = setInterval(voting.checkVote, 2500, voteMessage);
    voting.intervals.push(intervalId);

    return;
  },
  administrative: true,
  help: 'Call a vote. Constrain to a @role, and specify a reason.',
};
