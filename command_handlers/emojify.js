const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
  'u', 'v', 'w', 'x', 'y', 'z'];
const punycode = require('punycode');

if (process.env.FEAT_UTIL) {
  module.exports = {
    administrative: true,
    bind: 'emojify',
    handler: async function(message) {
      const word = message.content.split(' ').slice(1).join('').toLowerCase();
      // check if all letters are unique
      if (word.length != (new Set(word)).size) {
        await message.author.send('The message you specified cannot be used. All letters must be unique.');
        await message.delete();
        return;
      }

      // get the message before this one
      const messageBeforeLast = (await message.channel.fetchMessages({
        limit: 1,
        before: message.id,
      })).first();

      // 0x1F1E6 == 🇦
      const baseEmojiId = parseInt('1F1E6', 16);

      for (let character of word) {
        if (character != ' ') {
          await messageBeforeLast.react(punycode.ucs2.encode([baseEmojiId + alphabet.indexOf(character)]));
        }
      }

      await message.delete();
    },
    help: 'React to the previous message with some emoji',
  };
}
