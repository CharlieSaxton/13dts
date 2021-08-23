
if(!process.env.DATABASE_URL) {
    console.log("ERROR: DATABASE_URL not defined");
    console.log("Do something like: export DATABASE_URL=postgres://chaliesaxton@localhost:5432/13dts");
    process.exit();
  }
  
const { Pool } = require('pg');
var dbPool;

if(process.env.PGSSLMODE) {
    dbPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 55,
        ssl: {rejectUnauthorized: false}
    });
} else {
    dbPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 55
    });
}

dbPool.connect();

module.exports = dbPool;
  