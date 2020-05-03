# Omnium

[![Build Status](https://travis-ci.org/ciarancrocker/omnium.svg?branch=develop)](https://travis-ci.org/ciarancrocker/omnium)

A Discord bot made for the [Swansea Gaming Society](https://sugaming.co.uk). Includes features like:

* Automatic channel renaming - Help identify what games are being played in which channel at a glance
* Game statistics tracking - Provides insights for server operators as to what games are popular
* Burst channels - Automatically create and delete voice channels if existing ones get full

## Running the bot

This bot is not ready for production use out of the box, and is likely to require a number of source tweaks to fit your
exact application. There are unfortunately a number of areas where certain strings are hardcoded that make no sense outside
of the bot's original deployment, which you will need to change for your use case. 

The bot is not designed to be connected to multiple servers at this time, so if you want the bot to be in different
servers, you'll need to run multiple instances.

Make sure you have at least the following installed:

* Node.js version 12 or higher.
* PostgreSQL

The bot has only ever been tested to run on Linux; if you can get it to run on Windows, send in a pull request with
updated docs!

1. Clone the repository and check out whatever version you want to use (for now, master is your only real option)
2. Run `yarn` in the directory you cloned into to grab the dependencies
3. Copy the `.env.example` file to `.env` and set the configuration directives appropriately.
4. Import the schema file in the root of the repository into an empty database in Postgres. Make sure the owner of the
   tables, sequences and roles is set appropriately for what you set in the env file.
5. Start the bot with `node index.js` and pray.

To test the bot with eslint run `yarn test`. This will run eslint over all the code. If you'd rather run this test
and then launch the bot run `yarn run dev` which will do this for you as well.
