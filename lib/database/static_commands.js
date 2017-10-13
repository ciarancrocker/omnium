module.exports = function(pool) {
  const queries = {
    getStaticCommand: 'SELECT * FROM static_commands WHERE command = $1 LIMIT 1',
    getAllStaticCommands: 'SELECT * FROM static_commands',
    createStaticCommand: 'INSERT INTO static_commands VALUES ($1, $2)',
    updateStaticCommand: 'UPDATE static_commands SET return_text=$1 WHERE command=$2',
    deleteStaticCommand: 'DELETE FROM static_commands WHERE command=$1',
  };

  return {
    getStaticCommand: async function(command) {
      const selectResult = await pool.query(queries['getStaticCommand'], [command]);
      if (selectResult.rowCount == 1) {
        return selectResult.rows[0];
      } else {
        return null;
      }
    },

    getAllStaticCommands: async function() {
      const selectResult = await pool.query(queries['getAllStaticCommands']);
      return selectResult.rows;
    },

    createStaticCommand: async function(command, text) {
      const insertResult = await pool.query(queries['createStaticCommand'], [command, text]);
      return insertResult;
    },

    updateStaticCommand: async function(command, text) {
      const updateResult = await pool.query(queries['updateStaticCommand'], [text, command]);
      return updateResult;
    },

    deleteStaticCommand: async function(command) {
      const deleteResult = await pool.query(queries['deleteStaticCommand'], [command]);
      return deleteResult;
    },
  };
};
