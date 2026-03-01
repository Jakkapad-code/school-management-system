/**
 * Database Connection Module (db/database.js)
 * Exports a single persistent SQLite connection for use across the app.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hsm.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database:', dbPath);
});

// Enable foreign key enforcement
db.run('PRAGMA foreign_keys = ON');

module.exports = db;
