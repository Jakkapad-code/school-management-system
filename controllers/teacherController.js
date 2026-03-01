const db = require('../db/database');

// GET /teachers - แสดงรายชื่อครูทั้งหมด
const getAll = (req, res) => {
    const sql = `
        SELECT t.teacher_id, t.first_name, t.last_name, t.phone, t.email,
               u.username, r.room_name
        FROM Teachers t
        LEFT JOIN Users u ON t.user_id = u.user_id
        LEFT JOIN Rooms r ON t.room_id = r.room_id
        ORDER BY t.teacher_id ASC
    `;
    db.all(sql, [], (err, teachers) => {
        console.log('[DEBUG teachers] err:', err);
        console.log('[DEBUG teachers] count:', teachers ? teachers.length : 'null');
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลครู');
            return res.redirect('/dashboard');
        }
        res.render('teachers/index', { title: 'จัดการครู', teachers });
    });
};

// GET /teachers/add - แสดงฟอร์มเพิ่มครู
const getAdd = (req, res) => {
    const roomsSql = 'SELECT room_id, room_name FROM Rooms ORDER BY room_name ASC';
    const usersSql = `
        SELECT u.user_id, u.username FROM Users u
        WHERE u.role = 'Teacher'
          AND u.user_id NOT IN (SELECT user_id FROM Teachers WHERE user_id IS NOT NULL)
        ORDER BY u.username ASC
    `;
    db.all(roomsSql, [], (err, rooms) => {
        if (err) return res.render('teachers/add', { title: 'เพิ่มครู', rooms: [], users: [] });
        db.all(usersSql, [], (err2, users) => {
            res.render('teachers/add', { title: 'เพิ่มครู', rooms, users: err2 ? [] : users });
        });
    });
};

// POST /teachers/add - บันทึกข้อมูลครูใหม่
const postAdd = (req, res) => {
    const { first_name, last_name, phone, email, user_id, room_id } = req.body;

    if (!first_name || !last_name) {
        req.flash('error', 'กรุณากรอกชื่อและนามสกุล');
        return res.redirect('/teachers/add');
    }

    const sql = `
        INSERT INTO Teachers (first_name, last_name, phone, email, user_id, room_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        first_name.trim(),
        last_name.trim(),
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        user_id || null,
        room_id || null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                req.flash('error', 'อีเมลนี้มีอยู่ในระบบแล้ว');
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
            return res.redirect('/teachers/add');
        }
        req.flash('success', `เพิ่มครู ${first_name} ${last_name} สำเร็จ`);
        res.redirect('/teachers');
    });
};

// GET /teachers/:id/edit - แสดงฟอร์มแก้ไขครู
const getEdit = (req, res) => {
    const { id } = req.params;
    const teacherSql = 'SELECT * FROM Teachers WHERE teacher_id = ?';
    const roomsSql = 'SELECT room_id, room_name FROM Rooms ORDER BY room_name ASC';
    const usersSql = `
        SELECT u.user_id, u.username FROM Users u
        WHERE u.role = 'Teacher'
          AND (
            u.user_id NOT IN (SELECT user_id FROM Teachers WHERE user_id IS NOT NULL)
            OR u.user_id = (SELECT user_id FROM Teachers WHERE teacher_id = ?)
          )
        ORDER BY u.username ASC
    `;

    db.get(teacherSql, [id], (err, teacher) => {
        if (err || !teacher) {
            req.flash('error', 'ไม่พบข้อมูลครู');
            return res.redirect('/teachers');
        }
        db.all(roomsSql, [], (err2, rooms) => {
            db.all(usersSql, [id], (err3, users) => {
                res.render('teachers/edit', {
                    title: 'แก้ไขข้อมูลครู',
                    teacher,
                    rooms: err2 ? [] : rooms,
                    users: err3 ? [] : users
                });
            });
        });
    });
};

// POST /teachers/:id/edit - อัปเดตข้อมูลครู
const postEdit = (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, email, user_id, room_id } = req.body;

    if (!first_name || !last_name) {
        req.flash('error', 'กรุณากรอกชื่อและนามสกุล');
        return res.redirect(`/teachers/${id}/edit`);
    }

    const sql = `
        UPDATE Teachers
        SET first_name = ?, last_name = ?, phone = ?, email = ?, user_id = ?, room_id = ?
        WHERE teacher_id = ?
    `;
    const params = [
        first_name.trim(),
        last_name.trim(),
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        user_id || null,
        room_id || null,
        id
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                req.flash('error', 'อีเมลนี้มีอยู่ในระบบแล้ว');
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            }
            return res.redirect(`/teachers/${id}/edit`);
        }
        req.flash('success', `อัปเดตข้อมูลครู ${first_name} ${last_name} สำเร็จ`);
        res.redirect('/teachers');
    });
};

// POST /teachers/:id/delete - ลบข้อมูลครู
const deleteTeacher = (req, res) => {
    const { id } = req.params;
    db.get('SELECT first_name, last_name FROM Teachers WHERE teacher_id = ?', [id], (err, teacher) => {
        if (err || !teacher) {
            req.flash('error', 'ไม่พบข้อมูลครูที่ต้องการลบ');
            return res.redirect('/teachers');
        }
        db.run('DELETE FROM Teachers WHERE teacher_id = ?', [id], function (err2) {
            if (err2) {
                req.flash('error', 'เกิดข้อผิดพลาดในการลบข้อมูล');
            } else {
                req.flash('success', `ลบข้อมูลครู ${teacher.first_name} ${teacher.last_name} สำเร็จ`);
            }
            res.redirect('/teachers');
        });
    });
};

module.exports = { getAll, getAdd, postAdd, getEdit, postEdit, deleteTeacher };
