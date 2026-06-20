const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs       = require('fs');
const path     = require('path');
require('dotenv').config();

let dbInstance = null;

// Opens (or creates) the SQLite database and ensures tables exist
async function getDB() {
  if (dbInstance) return dbInstance;  // reuse the same connection

  dbInstance = await open({
    filename: process.env.DB_PATH || './db/devboard.sqlite',
    driver: sqlite3.Database
  });

  // Read schema.sql and run it — CREATE TABLE IF NOT EXISTS makes this safe to re-run
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await dbInstance.exec(schema);

  // Enable foreign key constraints (SQLite has them OFF by default!)
  await dbInstance.exec('PRAGMA foreign_keys = ON');

  console.log('Database connected and schema ensured.');
  return dbInstance;
}

module.exports = { getDB };