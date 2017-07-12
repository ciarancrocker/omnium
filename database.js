const knex = require('knex');
require('dotenv').config();

module.exports = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_SCHEMA,
  },
  pool: {
    min: 0,
    max: 10,
  },
});


