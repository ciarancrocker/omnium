require('dotenv').config();

const pg = require('pg');
const winston = require('winston');

const pool = module.exports.pool = new pg.Pool({
  user: process.env.PG_USERNAME,
  host: process.env.PG_HOSTNAME,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
});

const findUserQuery = 'SELECT id FROM users WHERE discord_id = $1 LIMIT 1';
const createUserQuery = 'INSERT INTO users (discord_id, display_name) VALUES' +
  ' ($1, $2) RETURNING id';
module.exports.findOrCreateUser = async function(discordUser) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN TRANSACTION');
      const searchResult = await client.query(findUserQuery, [discordUser.id]);
      if (searchResult.rowCount == 1) {
        // user was found
        winston.log('debug', 'Found user ID %s for Discord ID %s',
          searchResult.rows[0].id, discordUser.id);
        await client.query('COMMIT');
        return searchResult.rows[0].id;
      } else {
        // user was not found, create it
        const createResult = await client.query(createUserQuery,
          [discordUser.id, discordUser.tag]);
        winston.log('debug', 'Created new user ID %s for Discord ID %s',
          createResult.rows[0].id, discordUser.id);
        await client.query('COMMIT');
        return createResult.rows[0].id;
      }
    } finally {
      client.release();
    }
  };

const findGameQuery = 'SELECT id FROM games WHERE name = $1 LIMIT 1';
const createGameQuery = 'INSERT INTO games (name) VALUES ($1) RETURNING id';
module.exports.findOrCreateGame = async function(gameName) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN TRANSACTION');
      const searchResult = await client.query(findGameQuery, [gameName]);
      if (searchResult.rowCount == 1) {
        // game was found
        winston.log('debug', 'Found game ID %s for game %s',
          searchResult.rows[0].id, gameName);
        await client.query('COMMIT');
        return searchResult.rows[0].id;
      } else {
        const createResult = await client.query(createGameQuery, [gameName]);
        winston.log('debug', 'Created new game ID %s for game %s',
          createResult.rows[0].id, gameName);
        await client.query('COMMIT');
        return createResult.rows[0].id;
      }
    } finally {
      client.release();
    }
  };

const createNewSessionQuery = 'INSERT INTO game_sessions (user_id, game_id,' +
  ' session_start, state) VALUES ($1, $2, $3, $4) RETURNING id';
module.exports.createNewSession = async function(userId, gameId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION');
    const values = [userId, gameId, new Date(), 'in_progress'];
    const createResult = await client.query(createNewSessionQuery, values);
    winston.log('debug', 'Created new session (%s) for user %s playing %s',
      createResult.rows[0].id, userId, gameId);
    await client.query('COMMIT');
    return createResult.rows[0].id;
  } finally {
    client.release();
  }
};

const sessionDiscoverQuery = 'SELECT id FROM game_sessions WHERE ' +
  'user_id = $1 AND game_id = $2 AND state = \'in_progress\' ' +
  'ORDER BY session_start DESC LIMIT 1';
const sessionEndQuery = 'UPDATE game_sessions SET state = \'completed\', ' +
  'session_end = $1 WHERE id = $2 RETURNING id';
module.exports.endSession = async function(userId, gameId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION');
    const discoverResult = await client.query(sessionDiscoverQuery,
      [userId, gameId]);
    if (discoverResult.rowCount == 0) {
      // silently do nothing
      return;
    }
    const endResult = await client.query(sessionEndQuery,
      [new Date(), discoverResult.rows[0].id]);
    await client.query('COMMIT');
    winston.log('debug', 'Ended session (%s) for user %s playing %s',
      endResult.rows[0].id, userId, gameId);
    return;
  } finally {
    client.release();
  }
};

const gameStatisticsQuery = 'SELECT SUM(session_end - session_start) AS time,' +
  ' name FROM game_sessions INNER JOIN games ON' +
  ' game_sessions.game_id = games.id WHERE state = \'completed\'' +
  ' AND visible = true GROUP BY name ORDER BY time DESC LIMIT 50';
module.exports.getGameStatistics = async function() {
  const selectResult = await pool.query(gameStatisticsQuery);
  return selectResult.rows;
};

const userGameStatisticsQuery =
  'SELECT SUM(session_end - session_start) AS time, name FROM game_sessions' +
  ' INNER JOIN games ON game_sessions.game_id = games.id' +
  ' WHERE state = \'completed\' AND visible = true AND user_id = $1' +
  ' GROUP BY name ORDER BY time DESC LIMIT 50';
module.exports.getUserGameStatistics = async function(userId) {
  const selectResult = await pool.query(userGameStatisticsQuery, [userId]);
  return selectResult.rows;
};
