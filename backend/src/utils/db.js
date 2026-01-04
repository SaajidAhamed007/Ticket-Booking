import { Pool } from "pg";

const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Concurrency',
  password: 'haseena@009',
  port: '5432'
});

db.on("connect", () => {
  console.log("Connected to the database");
});

db.on("error", (err) => {
  console.error("Database error:", err);
  process.exit(1);
});

export default db;
