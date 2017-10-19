require('dotenv').config();

const pg = require('pg');
const winston = require('winston');

const pool = new pg.Pool({
  user: process.env.PG_USERNAME,
  host: process.env.PG_HOSTNAME,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
});

pool.on('connect', function() {
  winston.log('debug', 'New Postgres connection created.');
});

pool.on('error', function(err) {
  winston.log('debug', 'A Postgres connection emitted an error event.', err);
});

/**
 * Log an event to the database
 *
 * @param {String} event - Type of event that occurred
 * @param {Object} data - Optional JSON data relevant to the event
 *
 * @return {Object} Result of the insert
 */
async function logEvent(event, data = {}) {
  const insertResult = await pool.query('INSERT INTO event_log (event_type, data) VALUES ($1, $2)', [event, data]);
  return insertResult;
};

module.exports = {
  pool,
  ...(require('./users')(pool)),
  ...(require('./game_statistics')(pool)),
  ...(require('./channels')(pool)),
  ...(require('./static_commands')(pool)),
  logEvent,
};

