const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    "postgresql://Users_owner:phcxa2uSFkb0@ep-wandering-base-a1cbz947-pooler.ap-southeast-1.aws.neon.tech/Assignment?sslmode=require"
});
module.exports = { pool };