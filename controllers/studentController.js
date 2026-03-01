const db = require('../db/database');

// GET /students - แสดงรายชื่อนักเรียนทั้งหมด
const getAll = (req, res) => {
    const sql = `
        SELECT s.student_id, s.first_name, s.last_name, s.phone, s.email,
               s.sex, s.semester, s.year,
               u.username, r.room_name
        FROM Students s
        LEFT JOIN Users u ON s.user_id = u.user_id
        LEFT JOIN Rooms r ON s.room_id = r.room_id
        ORDER BY s.student_id ASC
    `;
    db.all(sql, [], (err, students) => {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน');
            return res.redirect('/dashboard');
        }
        res.render('students/index', { title: 'จัดการนักเรียน', students });
    });
};

// GET /students/add - แสดงฟอร์มเพิ่มนักเรียน
const getAdd = (req, res) => {
    const roomsSql = 'SELECT room_id, room_name FROM Rooms ORDER BY room_name ASC';
    const usersSql = `
        SELECT u.user_id, u.username FROM Users u
        WHERE u.role = 'Student'
          AND u.user_id NOT IN (SELECT user_id FROM Students WHERE user_id IS NOT NULL)
        ORDER BY u.username ASC
    `;
    const yearsSql = 'SELECT year FROM Year ORDER BY year DESC';
    db.all(roomsSql, [], (err, rooms) => {
        db.all(usersSql, [], (err2, users) => {
            db.all(yearsSql, [], (err3, years) => {
                res.render('students/add', {
                    title: 'เพิ่มนักเรียน',
                    rooms: err ? [] : rooms,
                    users: err2 ? [] : users,
                    years: err3 ? [] : years
                });
            });
        });
    });
};

// POST /students/add - บันทึกข้อมูลนักเรียนใหม่
const postAdd = (req, res) => {
    const { first_name, last_name, phone, email, sex, nationality,
            citizen_id, dob, room_id, semester, year, enroll_year, user_id } = req.body;

    if (!first_name || !last_name || !semester || !year) {
        req.flash('error', 'กรุณากรอกชื่อ นามสกุล ภาคเรียน และปีการศึกษา');
        return res.redirect('/students/add');
    }

    const sql = `
        INSERT INTO Students
            (first_name, last_name, phone, email, sex, nationality, citizen_id, dob, room_id, semester, year, enroll_year, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        first_name.trim(), last_name.trim(),
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        sex || null,
        nationality ? nationality.trim() : null,
        citizen_id ? citizen_id.trim() : null,
        dob || null,
        room_id || null,
        parseInt(semester), parseInt(year),
        enroll_year ? parseInt(enroll_year) : null,
        user_id || null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                req.flash('error', 'อีเมลหรือเลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว');
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
            return res.redirect('/students/add');
        }
        req.flash('success', `เพิ่มนักเรียน ${first_name} ${last_name} สำเร็จ`);
        res.redirect('/students');
    });
};

// GET /students/:id/edit - แสดงฟอร์มแก้ไขนักเรียน
const getEdit = (req, res) => {
    const { id } = req.params;
    const studentSql = 'SELECT * FROM Students WHERE student_id = ?';
    const roomsSql = 'SELECT room_id, room_name FROM Rooms ORDER BY room_name ASC';
    const usersSql = `
        SELECT u.user_id, u.username FROM Users u
        WHERE u.role = 'Student'
          AND (
            u.user_id NOT IN (SELECT user_id FROM Students WHERE user_id IS NOT NULL)
            OR u.user_id = (SELECT user_id FROM Students WHERE student_id = ?)
          )
        ORDER BY u.username ASC
    `;
    const yearsSql = 'SELECT year FROM Year ORDER BY year DESC';

    db.get(studentSql, [id], (err, student) => {
        if (err || !student) {
            req.flash('error', 'ไม่พบข้อมูลนักเรียน');
            return res.redirect('/students');
        }
        db.all(roomsSql, [], (err2, rooms) => {
            db.all(usersSql, [id], (err3, users) => {
                db.all(yearsSql, [], (err4, years) => {
                    res.render('students/edit', {
                        title: 'แก้ไขข้อมูลนักเรียน',
                        student,
                        rooms: err2 ? [] : rooms,
                        users: err3 ? [] : users,
                        years: err4 ? [] : years
                    });
                });
            });
        });
    });
};

// POST /students/:id/edit - อัปเดตข้อมูลนักเรียน
const postEdit = (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, email, sex, nationality,
            citizen_id, dob, room_id, semester, year, enroll_year, user_id } = req.body;

    if (!first_name || !last_name || !semester || !year) {
        req.flash('error', 'กรุณากรอกชื่อ นามสกุล ภาคเรียน และปีการศึกษา');
        return res.redirect(`/students/${id}/edit`);
    }

    const sql = `
        UPDATE Students
        SET first_name=?, last_name=?, phone=?, email=?, sex=?, nationality=?,
            citizen_id=?, dob=?, room_id=?, semester=?, year=?, enroll_year=?, user_id=?
        WHERE student_id=?
    `;
    const params = [
        first_name.trim(), last_name.trim(),
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        sex || null,
        nationality ? nationality.trim() : null,
        citizen_id ? citizen_id.trim() : null,
        dob || null,
        room_id || null,
        parseInt(semester), parseInt(year),
        enroll_year ? parseInt(enroll_year) : null,
        user_id || null,
        id
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                req.flash('error', 'อีเมลหรือเลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว');
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            }
            return res.redirect(`/students/${id}/edit`);
        }
        req.flash('success', `อัปเดตข้อมูลนักเรียน ${first_name} ${last_name} สำเร็จ`);
        res.redirect('/students');
    });
};

// POST /students/:id/delete - ลบข้อมูลนักเรียน
const deleteStudent = (req, res) => {
    const { id } = req.params;
    db.get('SELECT first_name, last_name FROM Students WHERE student_id = ?', [id], (err, student) => {
        if (err || !student) {
            req.flash('error', 'ไม่พบข้อมูลนักเรียนที่ต้องการลบ');
            return res.redirect('/students');
        }
        db.run('DELETE FROM Students WHERE student_id = ?', [id], function (err2) {
            if (err2) {
                req.flash('error', 'เกิดข้อผิดพลาดในการลบข้อมูล');
            } else {
                req.flash('success', `ลบข้อมูลนักเรียน ${student.first_name} ${student.last_name} สำเร็จ`);
            }
            res.redirect('/students');
        });
    });
};

module.exports = { getAll, getAdd, postAdd, getEdit, postEdit, deleteStudent };
