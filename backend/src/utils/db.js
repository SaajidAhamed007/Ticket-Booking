import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Database configuration from environment variables
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Concurrency',
  password: process.env.DB_PASSWORD || 'haseena@009',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection fails
};

const pool = new Pool(dbConfig);

// Connection event handlers
pool.on("connect", () => {
  console.log("Database connection pool created");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
  process.exit(1);
});

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Execute a SELECT query
 * @param {string} query - SQL query with placeholders
 * @param {array} params - Query parameters
 * @returns {Promise<array>} Query results
 */
const select = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("SELECT query error:", err.message);
    throw err;
  }
};

/**
 * Execute a SELECT query returning a single row
 * @param {string} query - SQL query with placeholders
 * @param {array} params - Query parameters
 * @returns {Promise<object|null>} Single row or null
 */
const selectOne = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  } catch (err) {
    console.error("SELECT ONE query error:", err.message);
    throw err;
  }
};

/**
 * Execute an INSERT query
 * @param {string} query - SQL query with placeholders
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Inserted row
 */
const insert = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows[0] || result;
  } catch (err) {
    console.error("INSERT query error:", err.message);
    throw err;
  }
};

/**
 * Execute an UPDATE query
 * @param {string} query - SQL query with placeholders
 * @param {array} params - Query parameters
 * @returns {Promise<number>} Number of rows affected
 */
const update = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rowCount;
  } catch (err) {
    console.error("UPDATE query error:", err.message);
    throw err;
  }
};

/**
 * Execute a DELETE query
 * @param {string} query - SQL query with placeholders
 * @param {array} params - Query parameters
 * @returns {Promise<number>} Number of rows deleted
 */
const deleteRow = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rowCount;
  } catch (err) {
    console.error("DELETE query error:", err.message);
    throw err;
  }
};

/**
 * Execute a transaction (multiple queries)
 * @param {Function} callback - Function containing queries to execute
 * @returns {Promise<any>} Result from callback
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", err.message);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Execute raw query (for complex queries)
 * @param {string} query - SQL query with placeholders
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Full result object
 */
const query = async (queryStr, params = []) => {
  try {
    const result = await pool.query(queryStr, params);
    return result;
  } catch (err) {
    console.error("Query error:", err.message);
    throw err;
  }
};

// ============================================
// EXPORT
// ============================================

export default pool;

export {
  select,
  selectOne,
  insert,
  update,
  deleteRow,
  transaction,
  query,
};
