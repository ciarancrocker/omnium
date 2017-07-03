const mysql = require('mysql');
const knex = require('knex');
require('dotenv').config();

module.exports = knex({
  client: 'mysql',
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


