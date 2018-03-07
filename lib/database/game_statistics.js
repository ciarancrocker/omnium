const crypto = require('crypto');
const winston = require('winston');

module.exports = function(pool) {
  const queries = {
    findGameQuery: 'SELECT id FROM games WHERE hash = $1 LIMIT 1',
    createGameQuery: 'INSERT INTO games (display_name, internal_name, hash) VALUES ($1, $2, $3) RETURNING id',
    createNewSessionQuery: 'INSERT INTO game_sessions (user_id, game_id, session_start, state) VALUES ($1, $2, $3, $4) RETURNING id',
    sessionDiscoverQuery: 'SELECT MAX(id) as id FROM game_sessions WHERE user_id = $1 AND game_id = $2 AND state = \'in_progress\' LIMIT 1',
    sessionEndQuery: 'UPDATE game_sessions SET state = \'completed\', session_end = $1 WHERE id = $2 RETURNING id',
    gameStatisticsQuery: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true GROUP BY name ORDER BY time DESC LIMIT $1',
    gameStatisticsQueryString: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND LOWER(name) ~ LOWER($1) GROUP BY name ORDER BY time DESC LIMIT $2;',
    userGameStatisticsQuery: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND user_id = $1 GROUP BY name ORDER BY time DESC LIMIT $2',
    userGameStatisticsQueryString: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND user_id = $1 AND LOWER(name) ~ LOWER($2) GROUP BY name ORDER BY time DESC LIMIT $3;',
    gameGraphQuery: 'SELECT DATE(session_end), JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND name IN (SELECT name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true GROUP BY name ORDER BY JUSTIFY_INTERVAL(SUM(session_end - session_start)) DESC LIMIT $1) GROUP BY DATE(session_end), name ORDER BY DATE LIMIT ($1 * $2);',
    gameGraphQueryString: 'SELECT DATE(session_end), JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND name IN (SELECT name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND LOWER(name) ~ LOWER($2) GROUP BY name ORDER BY JUSTIFY_INTERVAL(SUM(session_end - session_start)) DESC LIMIT $1) GROUP BY DATE(session_end), name ORDER BY DATE LIMIT ($1 * $3);',
  };

  return {
    findOrCreateGame: async function(gameName) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        // compute internal name and hash for the game
        const internalName = gameName.replace(/[ ''\-!?\.]|\(.+\)/g, '').toLowerCase();
        const gameHash = crypto.createHash('sha512').update(internalName).digest('hex');
        const searchResult = await client.query(queries['findGameQuery'], [gameHash]);
        if (searchResult.rowCount == 1) {
          // game was found
          winston.log('debug', 'Found game ID %s for game %s', searchResult.rows[0].id, gameName);
          await client.query('COMMIT');
          return searchResult.rows[0].id;
        } else {
          const createResult = await client.query(queries['createGameQuery'], [gameName, internalName, gameHash]);
          winston.log('debug', 'Created new game ID %s for game %s', createResult.rows[0].id, gameName);
          await client.query('COMMIT');
          return createResult.rows[0].id;
        }
      } catch (e) {
        winston.log('error', 'Failed to find or create game', e);
      } finally {
        client.release();
      }
    },

    createNewSession: async function(userId, gameId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        const values = [userId, gameId, new Date(), 'in_progress'];
        const createResult = await client.query(queries['createNewSessionQuery'], values);
        winston.log('debug', 'Created new session (%s) for user %s playing %s', createResult.rows[0].id, userId, gameId);
        await client.query('COMMIT');
        return createResult.rows[0].id;
      } catch (e) {
        winston.log('error', 'Failed to begin session.', e);
      } finally {
        client.release();
      }
    },

    endSession: async function(userId, gameId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        const discoverResult = await client.query(queries['sessionDiscoverQuery'], [userId, gameId]);
        if (discoverResult.rowCount == 0) {
          // silently do nothing
          return;
        }
        const endResult = await client.query(queries['sessionEndQuery'], [new Date(), discoverResult.rows[0].id]);
        await client.query('COMMIT');
        winston.log('debug', 'Ended session (%s) for user %s playing %s', endResult.rows[0].id, userId, gameId);
        return;
      } catch (e) {
        winston.log('error', 'Failed to end session.', e);
      } finally {
        client.release();
      }
    },

    getGameStatistics: async function(limit) {
      const selectResult = await pool.query(queries['gameStatisticsQuery'], [limit]);
      return selectResult.rows;
    },

    getStatisticsForGame: async function(game, limit) {
      const selectResult = await pool.query(queries['gameStatisticsQueryString'], [game + '*', limit]);
      return selectResult.rows;
    },

    getUserGameStatistics: async function(userId, limit) {
      const selectResult = await pool.query(queries['userGameStatisticsQuery'], [userId, limit]);
      return selectResult.rows;
    },

    getUserStatisticsForGame: async function(user, game, limit) {
      const selectResult = await pool.query(queries['userGameStatisticsQueryString'], [user, game + '*', limit]);
      return selectResult.rows;
    },

    getGameGraph: async function(limit, days) {
      const selectResult = await pool.query(queries['gameGraphQuery'], [limit, days]);
      return selectResult.rows;
    },

    getGameGraphForGame: async function(limit, game, days) {
      const selectResult = await pool.query(queries['gameGraphQueryString'], [limit, game, days]);
      return selectResult.rows;
    },
  };
};
