const { Pool, types } = require("pg");
require("dotenv").config();

// PostgreSQL DATE OID is 1082. Parse as string to avoid UTC midnight shifting.
types.setTypeParser(1082, (str) => str);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
