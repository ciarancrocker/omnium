module.exports.sendError = async function(message, errorText, timeout = 5) {
  const errorMessage = await message.reply(errorText);
  try {
    await message.delete();
  } catch (e) {
    // That message might have already been deleted elsewhere
  }
  await errorMessage.delete({timeout: timeout * 1000});
  return;
};
