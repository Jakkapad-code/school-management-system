const db = require('../db/database');

// GET /classrooms
const getAll = (req, res) => {
    const sql = `
        SELECT r.room_id, r.room_name, r.description, r.status, r.grade_level,
               COUNT(s.student_id) AS student_count
        FROM Rooms r
        LEFT JOIN Students s ON r.room_id = s.room_id
        GROUP BY r.room_id
        ORDER BY r.grade_level ASC, r.room_name ASC
    `;
    db.all(sql, [], (err, rooms) => {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลห้องเรียน');
            return res.redirect('/dashboard');
        }
        res.render('classrooms/index', { title: 'จัดการห้องเรียน', rooms });
    });
};

// GET /classrooms/add
const getAdd = (req, res) => {
    res.render('classrooms/add', { title: 'เพิ่มห้องเรียน' });
};

// POST /classrooms/add
const postAdd = (req, res) => {
    const { room_name, description, status, grade_level } = req.body;

    if (!room_name || !status || !grade_level) {
        req.flash('error', 'กรุณากรอกชื่อห้อง สถานะ และระดับชั้น');
        return res.redirect('/classrooms/add');
    }

    const sql = `INSERT INTO Rooms (room_name, description, status, grade_level) VALUES (?, ?, ?, ?)`;
    const params = [room_name.trim(), description ? description.trim() : null, status, parseInt(grade_level)];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                req.flash('error', `ชื่อห้อง "${room_name}" มีอยู่ในระบบแล้ว`);
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
            return res.redirect('/classrooms/add');
        }
        req.flash('success', `เพิ่มห้องเรียน ${room_name} สำเร็จ`);
        res.redirect('/classrooms');
    });
};

// GET /classrooms/:id/edit
const getEdit = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Rooms WHERE room_id = ?', [id], (err, room) => {
        if (err || !room) {
            req.flash('error', 'ไม่พบข้อมูลห้องเรียน');
            return res.redirect('/classrooms');
        }
        res.render('classrooms/edit', { title: 'แก้ไขข้อมูลห้องเรียน', room });
    });
};

// POST /classrooms/:id/edit
const postEdit = (req, res) => {
    const { id } = req.params;
    const { room_name, description, status, grade_level } = req.body;

    if (!room_name || !status || !grade_level) {
        req.flash('error', 'กรุณากรอกชื่อห้อง สถานะ และระดับชั้น');
        return res.redirect(`/classrooms/${id}/edit`);
    }

    const sql = `UPDATE Rooms SET room_name=?, description=?, status=?, grade_level=? WHERE room_id=?`;
    const params = [room_name.trim(), description ? description.trim() : null, status, parseInt(grade_level), id];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                req.flash('error', `ชื่อห้อง "${room_name}" มีอยู่ในระบบแล้ว`);
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            }
            return res.redirect(`/classrooms/${id}/edit`);
        }
        req.flash('success', `อัปเดตห้องเรียน ${room_name} สำเร็จ`);
        res.redirect('/classrooms');
    });
};

// POST /classrooms/:id/delete
const deleteClassroom = (req, res) => {
    const { id } = req.params;
    db.get('SELECT room_name FROM Rooms WHERE room_id = ?', [id], (err, room) => {
        if (err || !room) {
            req.flash('error', 'ไม่พบห้องเรียนที่ต้องการลบ');
            return res.redirect('/classrooms');
        }
        db.run('DELETE FROM Rooms WHERE room_id = ?', [id], function (err2) {
            if (err2) {
                req.flash('error', 'ไม่สามารถลบได้ เนื่องจากห้องเรียนนี้มีข้อมูลที่เชื่อมอยู่');
            } else {
                req.flash('success', `ลบห้องเรียน ${room.room_name} สำเร็จ`);
            }
            res.redirect('/classrooms');
        });
    });
};

module.exports = { getAll, getAdd, postAdd, getEdit, postEdit, deleteClassroom };
