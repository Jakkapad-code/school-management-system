const db = require('../db/database');

const DAY_ORDER = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };

// GET /schedules
const getAll = (req, res) => {
    const sql = `
        SELECT sc.ID, sc.day, sc.period, sc.type, sc.semester, sc.year,
               r.room_name, r.room_id,
               s.subject_id, s.subject_name,
               t.first_name, t.last_name
        FROM Schedule sc
        LEFT JOIN Rooms r    ON sc.room_id    = r.room_id
        LEFT JOIN Subjects s ON sc.subject_id = s.subject_id
        LEFT JOIN Teachers t ON s.teacher_id  = t.teacher_id
        ORDER BY sc.year DESC, sc.semester DESC,
            CASE sc.day
                WHEN 'Monday'    THEN 1 WHEN 'Tuesday'  THEN 2 WHEN 'Wednesday' THEN 3
                WHEN 'Thursday'  THEN 4 WHEN 'Friday'   THEN 5 WHEN 'Saturday'  THEN 6
                WHEN 'Sunday'    THEN 7
            END, sc.period ASC
    `;
    db.all(sql, [], (err, schedules) => {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลตารางสอน');
            return res.redirect('/dashboard');
        }
        res.render('schedules/index', { title: 'ตารางสอน', schedules });
    });
};

// Helpers for add/edit — fetch dropdown data
const _fetchFormData = (callback) => {
    const roomsSql    = 'SELECT room_id, room_name, grade_level FROM Rooms ORDER BY grade_level, room_name ASC';
    const subjectsSql = `
        SELECT s.subject_id, s.subject_name, s.grade_level,
               t.first_name, t.last_name
        FROM Subjects s
        LEFT JOIN Teachers t ON s.teacher_id = t.teacher_id
        ORDER BY s.grade_level ASC, s.subject_name ASC
    `;
    const yearsSql = 'SELECT year FROM Year ORDER BY year DESC';

    db.all(roomsSql, [], (err, rooms) => {
        db.all(subjectsSql, [], (err2, subjects) => {
            db.all(yearsSql, [], (err3, years) => {
                callback(
                    err  ? [] : rooms,
                    err2 ? [] : subjects,
                    err3 ? [] : years
                );
            });
        });
    });
};

// GET /schedules/add
const getAdd = (req, res) => {
    _fetchFormData((rooms, subjects, years) => {
        res.render('schedules/add', { title: 'เพิ่มตารางสอน', rooms, subjects, years });
    });
};

// POST /schedules/add
const postAdd = (req, res) => {
    const { room_id, day, period, type, subject_id, semester, year } = req.body;

    if (!day || !period || !type || !semester || !year) {
        req.flash('error', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ (วัน, คาบ, ประเภท, ภาคเรียน, ปี)');
        return res.redirect('/schedules/add');
    }

    const sql = `INSERT INTO Schedule (room_id, day, period, type, subject_id, semester, year)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        room_id || null,
        day,
        parseInt(period),
        type,
        subject_id || null,
        parseInt(semester),
        parseInt(year)
    ];

    db.run(sql, params, function (err) {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            return res.redirect('/schedules/add');
        }
        req.flash('success', 'เพิ่มตารางสอนสำเร็จ');
        res.redirect('/schedules');
    });
};

// GET /schedules/:id/edit
const getEdit = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Schedule WHERE ID = ?', [id], (err, schedule) => {
        if (err || !schedule) {
            req.flash('error', 'ไม่พบข้อมูลตารางสอน');
            return res.redirect('/schedules');
        }
        _fetchFormData((rooms, subjects, years) => {
            res.render('schedules/edit', { title: 'แก้ไขตารางสอน', schedule, rooms, subjects, years });
        });
    });
};

// POST /schedules/:id/edit
const postEdit = (req, res) => {
    const { id } = req.params;
    const { room_id, day, period, type, subject_id, semester, year } = req.body;

    if (!day || !period || !type || !semester || !year) {
        req.flash('error', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
        return res.redirect(`/schedules/${id}/edit`);
    }

    const sql = `UPDATE Schedule SET room_id=?, day=?, period=?, type=?, subject_id=?, semester=?, year=?
                 WHERE ID=?`;
    const params = [
        room_id || null, day, parseInt(period), type,
        subject_id || null, parseInt(semester), parseInt(year), id
    ];

    db.run(sql, params, function (err) {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            return res.redirect(`/schedules/${id}/edit`);
        }
        req.flash('success', 'อัปเดตตารางสอนสำเร็จ');
        res.redirect('/schedules');
    });
};

// POST /schedules/:id/delete
const deleteSchedule = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM Schedule WHERE ID = ?', [id], function (err) {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการลบข้อมูล');
        } else {
            req.flash('success', 'ลบตารางสอนสำเร็จ');
        }
        res.redirect('/schedules');
    });
};

module.exports = { getAll, getAdd, postAdd, getEdit, postEdit, deleteSchedule };
