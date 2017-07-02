const winston = require('winston');

const mariasql = require('mariasql');

function setupDatabaseClient() {
  let dbClient = new mariasql({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    db: process.env.DB_SCHEMA,
  });
  dbClient.on('error', resetDatabaseClient);
  return dbClient;
}

function resetDatabaseClient(err) {
  winston.log('error', 'Resetting database client due to error.', err);
  dbClient.end();
  dbClient.destroy();
  dbClient = setupDatabaseClient();
}

let dbClient = setupDatabaseClient();

function addEvent(user_id, game, event) {
  dbClient.query(
    'INSERT INTO GameLog (user_id, game, event) VALUES (:user_id, :game, :event)',
    { user_id, game, event },
    function(err) {
      if (err) {
        winston.log('error', 'Failed to log presence change event', err);
      } else {
        winston.log('debug', 'Logged presence change event', { user_id, game, event });
      }
    }
  );
}

function handlePresenceUpdate(before, after) {
  if(before.presence != after.presence || before.presence.game != after.presence.game) {
    if(before.presence.game) {
      winston.log('info', 'User %s stopped playing %s', before.user.tag, before.presence.game.name);
      addEvent(before.user.id, before.presence.game.name, 'end');
    }
    if(after.presence.game) {
      winston.log('info', 'User %s started playing %s', after.user.tag, after.presence.game.name);
      addEvent(after.user.id, after.presence.game.name, 'begin');
    }
  }
}

module.exports.handlePresenceUpdate = handlePresenceUpdate;
