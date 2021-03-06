const logger = require('../logging');

module.exports = function(pool) {
  const queries = {
    findGameQuery: 'SELECT id FROM games WHERE internal_name = $1 LIMIT 1',
    createGameQuery: 'INSERT INTO games (display_name, internal_name) VALUES ($1, $2) RETURNING id',
    createNewSessionQuery: 'INSERT INTO game_sessions (user_id, game_id, session_start, state) VALUES ($1, $2, $3, $4) RETURNING id',
    sessionDiscoverQuery: 'SELECT MAX(id) as id FROM game_sessions WHERE user_id = $1 AND game_id = $2 AND state = \'in_progress\' LIMIT 1',
    sessionEndQuery: 'UPDATE game_sessions SET state = \'completed\', session_end = $1 WHERE id = $2 RETURNING id',
    gameStatisticsQuery: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, display_name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true GROUP BY display_name ORDER BY time DESC LIMIT $1',
    gameStatisticsQueryString: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, display_name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND LOWER(display_name) ~ LOWER($1) GROUP BY display_name ORDER BY time DESC LIMIT $2;',
    userGameStatisticsQuery: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, display_name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND user_id = $1 GROUP BY display_name ORDER BY time DESC LIMIT $2',
    userGameStatisticsQueryString: 'SELECT JUSTIFY_INTERVAL(SUM(session_end - session_start)) AS time, display_name FROM game_sessions INNER JOIN games ON game_sessions.game_id = games.id WHERE state = \'completed\' AND visible = true AND user_id = $1 AND LOWER(display_name) ~ LOWER($2) GROUP BY display_name ORDER BY time DESC LIMIT $3;',
  };

  return {
    findOrCreateGame: async function(gameName) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        // compute internal name and hash for the game
        const internalName = gameName.replace(/[ ''\-!?\.]|\(.+\)/g, '').toLowerCase();
        const searchResult = await client.query(queries['findGameQuery'], [internalName]);
        if (searchResult.rowCount == 1) {
          // game was found
          logger.log('debug', `Found game ID ${searchResult.rows[0].id} for game ${gameName}`);
          await client.query('COMMIT');
          return searchResult.rows[0].id;
        } else {
          const createResult = await client.query(queries['createGameQuery'], [gameName, internalName]);
          logger.log('debug', `Created new game ID ${createResult.rows[0].id} for game ${gameName}`);
          await client.query('COMMIT');
          return createResult.rows[0].id;
        }
      } catch (e) {
        logger.log('error', 'Failed to find or create game', e);
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    },

    createNewSession: async function(userId, gameId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        // before just blindly opening a new session, check to see if the user already has a session for the same game.
        // if they do, don't create a new session as it'll gum up the database
        // if they don't, then create a new session for them
        const sessionSearch = await client.query('SELECT MAX(id) as id FROM game_sessions WHERE user_id=$1 AND game_id=$2 AND state=\'in_progress\'', [userId, gameId]);
        let sessionId = sessionSearch.rows[0].id;
        if (sessionId) { // they already have a session
          logger.log('debug', `Continuing dangling session ${sessionSearch.rows[0].id} for user ${userId} playing ${gameId}`);
        } else { // they don't have a session for this game, start a new one
          const values = [userId, gameId, new Date(), 'in_progress'];
          const createResult = await client.query(queries['createNewSessionQuery'], values);
          sessionId = createResult.rows[0].id;
          logger.log('debug', `Created new session ${sessionId} for user ${userId} playing ${gameId}`);
        }
        await client.query('COMMIT');
        return sessionId;
      } catch (e) {
        await client.query('ROLLBACK');
        logger.log('error', 'Failed to begin session.', e);
      } finally {
        client.release();
      }
    },

    endSession: async function(userId, gameId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN TRANSACTION');
        const discoverResult = await client.query(queries['sessionDiscoverQuery'], [userId, gameId]);
        const sessionId = discoverResult.rows[0].id;
        if (!sessionId) {
          logger.log('debug', `No session found for user ${userId} playing ${gameId}`);
          return;
        }
        await client.query(queries['sessionEndQuery'], [new Date(), sessionId]);
        await client.query('COMMIT');
        logger.log('debug', `Ended session ${sessionId} for user ${userId} playing ${gameId}`);
        return;
      } catch (e) {
        await client.query('ROLLBACK');
        logger.log('error', 'Failed to end session.', e);
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
