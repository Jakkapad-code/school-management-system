/**
 * Seed Script (db/seed.js)
 * Creates default users: Admin, Teacher, Student
 * Run: node db/seed.js
 */

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'hsm.db'));

// Promisify helpers
const run = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        })
    );

(async () => {
    try {
        // --- Clean up existing seed users (in dependency order) ---
        await run(`DELETE FROM Teachers WHERE email = 'somchai@school.ac.th'`);
        await run(`DELETE FROM Students WHERE email = 'malee@school.ac.th'`);
        await run(`DELETE FROM Users WHERE username IN ('admin', 'teacher1', 'student1')`);

        // --- Admin ---
        const adminHash = await bcrypt.hash('123456', 10);
        await run(
            `INSERT INTO Users (username, password, role) VALUES (?, ?, ?)`,
            ['admin', adminHash, 'Admin']
        );
        console.log('✓ Admin    — username: "admin"    / password: "123456"');

        // --- Teacher ---
        const teacherHash = await bcrypt.hash('123456', 10);
        const teacherUser = await run(
            `INSERT INTO Users (username, password, role) VALUES (?, ?, ?)`,
            ['teacher1', teacherHash, 'Teacher']
        );
        await run(
            `INSERT INTO Teachers (first_name, last_name, phone, email, user_id)
             VALUES (?, ?, ?, ?, ?)`,
            ['สมชาย', 'ใจดี', '081-234-5678', 'somchai@school.ac.th', teacherUser.lastID]
        );
        console.log('✓ Teacher  — username: "teacher1" / password: "123456"');

        // --- Student ---
        const studentHash = await bcrypt.hash('123456', 10);
        const studentUser = await run(
            `INSERT INTO Users (username, password, role) VALUES (?, ?, ?)`,
            ['student1', studentHash, 'Student']
        );
        await run(
            `INSERT INTO Students
             (first_name, last_name, phone, sex, nationality, email,
              semester, year, user_id, citizen_id, dob, enroll_year)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'มาลี', 'รักเรียน', '089-765-4321', 'Female', 'Thai',
                'malee@school.ac.th', 1, 2025, studentUser.lastID,
                '1234567890123', '2008-05-15', 2025,
            ]
        );
        console.log('✓ Student  — username: "student1" / password: "123456"');

        console.log('\nSeed completed successfully.');
    } catch (err) {
        console.error('Seed error:', err.message);
    } finally {
        db.close();
    }
})();
