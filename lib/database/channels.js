module.exports = function(pool) {
  const queries = {
    createChannelQuery: 'INSERT INTO channels (discord_id, name, temporary, temporary_index) VALUES ($1, $2, true, $3)',
    deleteChannelQuery: 'DELETE FROM channels WHERE discord_id = $1',
    newestChannelIdQuery: 'SELECT discord_id FROM channels WHERE temporary_index=(SELECT MAX(temporary_index) FROM channels) LIMIT 1',
    joinedChannelQuery: 'INSERT INTO channel_join_order (channel_id, user_id, join_order) VALUES ($1, $2, (SELECT COALESCE(MAX(join_order) + 1, 1) FROM channel_join_order WHERE channel_id = \'$1\'))',
    leftChannelQuery: 'DELETE FROM channel_join_order WHERE user_id=$1',
  };

  return {
    createChannel: async function(channel, channelNumber) {
      const insertResult = await pool.query(queries['createChannelQuery'], [channel.id, channel.name, channelNumber]);
      return insertResult;
    },

    deleteChannel: async function(channelId) {
      const deleteResult = await pool.query(queries['deleteChannelQuery'], [channelId]);
      return deleteResult;
    },

    getNextChannelNumber: async function() {
      const selectResult = await pool.query('SELECT MAX(temporary_index) AS value FROM channels;');
      if (selectResult.rowCount == 1) {
        return selectResult.rows[0].value + 1;
      } else {
        return 1;
      }
    },

    getNewestChannelId: async function() {
      const selectResult = await pool.query(queries['newestChannelIdQuery']);
      if (selectResult.rowCount == 1) {
        return selectResult.rows[0].discord_id;
      } else {
        return null;
      }
    },

    joinChannel: async function(channelId, userId) {
      const insertResult = await pool.query(queries['joinedChannelQuery'], [channelId, userId]);
      return insertResult;
    },

    leaveChannel: async function(userId) {
      const deleteResult = await pool.query(queries['leftChannelQuery'], [userId]);
      return deleteResult;
    },
  };
};
