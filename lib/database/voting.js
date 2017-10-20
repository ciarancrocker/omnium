const moment = require('moment');
const uuid = require('uuid/v4');

module.exports = function(pool) {
  const datePlusOneHour = () => {
    return moment().add(1, 'hour').toDate();
  };

  return {
    createVote: async function(topic, roleId, messageId, start = new Date(), finish = datePlusOneHour()) {
      const insertResult = await pool.query('INSERT INTO votes (id, message_id, topic, role_id, start, finish) ' +
        'VALUES ($1, $2, $3, $4, $5, $6)', [uuid(), messageId, topic, roleId, start, finish]);
      return insertResult;
    }
  };
}
