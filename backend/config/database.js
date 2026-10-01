const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("PostgreSQL database connected successfully");
});

pool.on("error", (error) => {
  console.error("PostgreSQL database error:", error.message);
});

module.exports = pool;