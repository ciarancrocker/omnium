const database = require('../lib/database');
require('moment-duration-format');
const textHelpers = require('../lib/text_helpers');
const plot = require('plotter').plot;

module.exports = {
  bind: 'game_graph',
  handler: async function(message) {
    let args = textHelpers.getArgs(message.content);
    const days = 30;
    let games = 9;
    let data = [];

    if (isNaN(args[1]) && typeof args[1] !== 'undefined') {
      data = await database.getGameGraphString(
        args[2],
        args[1].replace(/["']/g, ''),
        days
      );
      games = args[2];
    } else {
      if (typeof args[1] !== 'undefined') {
        data = await database.getGameGraph(parseInt(args[1]), days);
        games = parseInt(args[1]);
      } else {
        data = await database.getGameGraph(games, days);
      }
    }

    if (data.length > 1) {
      let toPlot = {};
      for (let i = 0; i < data.length; i++ ) {
        toPlot[data[i].name] = [];
      }
      for (let i = 0; i < data.length; i++) {
        let formated = '0:0';
        if (typeof data[i].time.hours !== 'undefined') {
          formated = data[i].time.hours + ':' + data[i].time.minutes;
        } else {
          formated = '0:' + data[i].time.minutes;
        }
        toPlot[data[i].name].push(formated);
      }

      plot({
        data: toPlot,
        title: 'Time played for top ' + games + ' games',
        xlabel: 'Days',
        ylabel: 'Hours played',
        filename: 'graph.png',
        finish: function() {
          message.reply('', {
            file: 'graph.png',
          }, );
        },
      }, );
    } else {
      message.reply('Not enough data for that game :(');
    }
  },
  help: 'Show game graph for the server',
};
