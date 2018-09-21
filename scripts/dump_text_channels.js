const djs = require('discord.js');
const fs = require('fs');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

require('dotenv').config();

const client = new djs.Client();

(async function() {
  await client.login(process.env.DISCORD_KEY);

  const guild = client.guilds.first();
  const channels = guild.channels.array();
  const textChannels = channels.filter((x) => x.type == 'text');
  console.log(`${textChannels.length} channels to process`);
  for (let channel of textChannels) {
    await saveChannelLog(channel);
  }
  console.log('We\'re done!');
  await client.destroy();
})();

/**
 * Save the message history log for the specified channel in a JSON format
 *
 * @param {Channel} channel The channel to save the logs for
 */
async function saveChannelLog(channel) {
  console.log(`Processing channel ${channel.name}`);
  const msgs = await getMessagesRecursive(channel);
  msgs.sort((a, b) => a.id - b.id);
  const storableMsgs = msgs.map((x) => ({
    message_id: x.id,
    user: x.author.tag,
    user_id: x.author.id,
    sent: x.createdAt,
    content: x.content,
  }));
  const msgsJson = JSON.stringify(storableMsgs);
  console.log('Writing to disk');
  await writeFile(`${channel.name}.json`, msgsJson);
  console.log('Done writing');
  console.log(`Finished processing channel ${channel.name}`);
  return;
}

/**
 * Retrieve the messaage log for a channel recursively.
 *
 * @param {Channel} channel The channel to retrieve the logs for
 * @param {string} before Largest message ID to get
 * @return {array}
 */
async function getMessagesRecursive(channel, before = undefined) {
  const msgs = await channel.fetchMessages({
    limit: 50,
    before: before,
  });
  console.log({channel: channel.name, before});
  if (msgs.size == 50) { // get messages before the earliest in this log
    const firstMsg = msgs.last();
    return [...(msgs.array()), ...(await getMessagesRecursive(channel, firstMsg.id))];
  } else { // this is the lowest, let's return
    return msgs.array();
  }
}
