/**
 * Database Initialization Script (init_db.js)
 * This script initializes the SQLite database by creating all necessary tables
 * according to the High School Management System schema.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the database path
const dbPath = path.resolve(__dirname, 'hsm.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`Connected to the SQLite database at ${dbPath}`);
    }
});

// --- SQL Statements ---

const createTablesSQL = `
-- 1. Year Table
CREATE TABLE IF NOT EXISTS Year (
    year INTEGER PRIMARY KEY
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    profile_picture TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Student'))
);

-- 3. Rooms Table
CREATE TABLE IF NOT EXISTS Rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('In-used', 'Unused')),
    grade_level INTEGER NOT NULL
);

-- 4. Teachers Table
CREATE TABLE IF NOT EXISTS Teachers (
    teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    user_id INTEGER UNIQUE,
    room_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE SET NULL
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS Students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    sex TEXT CHECK (sex IN ('Male', 'Female', 'Other')),
    nationality TEXT,
    email TEXT UNIQUE,
    room_id INTEGER,
    semester INTEGER NOT NULL,
    year INTEGER NOT NULL,
    user_id INTEGER UNIQUE,
    citizen_id TEXT UNIQUE,
    dob TEXT, -- Stored as TEXT (e.g., YYYY-MM-DD)
    enroll_year INTEGER,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 6. Subjects Table
CREATE TABLE IF NOT EXISTS Subjects (
    subject_id TEXT PRIMARY KEY, -- e.g., 'CS101'
    subject_name TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    credit INTEGER NOT NULL,
    teacher_id INTEGER,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE SET NULL
);

-- 7. Schedule Table
CREATE TABLE IF NOT EXISTS Schedule (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    period INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Class', 'Meeting', 'Other')),
    subject_id TEXT,
    semester INTEGER NOT NULL,
    year INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE SET NULL
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS Attendance (
    student_id INTEGER,
    date TEXT NOT NULL, -- Stored as TEXT (e.g., YYYY-MM-DD)
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
    PRIMARY KEY (student_id, date),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
);

-- 9. Grade Entries Table
CREATE TABLE IF NOT EXISTS Grade_Entries (
    grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    year INTEGER NOT NULL,
    subject_id TEXT NOT NULL,
    grade INTEGER, -- Assuming grade is a number (e.g., 0-100)
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE RESTRICT
);

-- 10. Exam Schedule Table
CREATE TABLE IF NOT EXISTS Exam_Schedule (
    exam_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- Stored as TEXT (e.g., YYYY-MM-DD)
    semester INTEGER NOT NULL,
    year INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Midterm', 'Final'))
);

-- 11. Exam Schedule Entries Table
CREATE TABLE IF NOT EXISTS Exam_Schedule_Entries (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    start TEXT NOT NULL, -- Time e.g., HH:MM
    end TEXT NOT NULL,   -- Time e.g., HH:MM
    subject_id TEXT,
    exam_id INTEGER NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE SET NULL,
    FOREIGN KEY (exam_id) REFERENCES Exam_Schedule(exam_id) ON DELETE CASCADE
);
`;

db.serialize(() => {
    console.log('Starting database initialization...');
    
    // Execute all table creation statements sequentially
    db.exec(createTablesSQL, (err) => {
        if (err) {
            console.error('Error creating tables:', err.message);
        } else {
            console.log('All tables created or already exist successfully.');
        }

        // Optional: Insert initial year data (e.g., current and next year)
        const initialYear = new Date().getFullYear();
        db.run("INSERT OR IGNORE INTO Year (year) VALUES (?)", [initialYear]);
        db.run("INSERT OR IGNORE INTO Year (year) VALUES (?)", [initialYear + 1]);
        console.log('Inserted initial year data.');

        // Close the database connection
        db.close((closeErr) => {
            if (closeErr) {
                console.error('Error closing database:', closeErr.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    });
});
