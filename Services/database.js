const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    POSTGRES_URI
});
module.exports = { pool };