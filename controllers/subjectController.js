const db = require('../db/database');

// GET /subjects
const getAll = (req, res) => {
    const sql = `
        SELECT s.subject_id, s.subject_name, s.grade_level, s.credit,
               t.first_name, t.last_name
        FROM Subjects s
        LEFT JOIN Teachers t ON s.teacher_id = t.teacher_id
        ORDER BY s.grade_level ASC, s.subject_id ASC
    `;
    db.all(sql, [], (err, subjects) => {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลวิชา');
            return res.redirect('/dashboard');
        }
        res.render('subjects/index', { title: 'จัดการวิชาเรียน', subjects });
    });
};

// GET /subjects/add
const getAdd = (req, res) => {
    const sql = 'SELECT teacher_id, first_name, last_name FROM Teachers ORDER BY first_name ASC';
    db.all(sql, [], (err, teachers) => {
        res.render('subjects/add', { title: 'เพิ่มวิชาเรียน', teachers: err ? [] : teachers });
    });
};

// POST /subjects/add
const postAdd = (req, res) => {
    const { subject_id, subject_name, grade_level, credit, teacher_id } = req.body;

    if (!subject_id || !subject_name || !grade_level || !credit) {
        req.flash('error', 'กรุณากรอกรหัสวิชา ชื่อวิชา ระดับชั้น และหน่วยกิต');
        return res.redirect('/subjects/add');
    }

    const sql = `INSERT INTO Subjects (subject_id, subject_name, grade_level, credit, teacher_id)
                 VALUES (?, ?, ?, ?, ?)`;
    const params = [
        subject_id.trim().toUpperCase(),
        subject_name.trim(),
        parseInt(grade_level),
        parseInt(credit),
        teacher_id || null
    ];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE') || err.message.includes('PRIMARY KEY')) {
                req.flash('error', `รหัสวิชา "${subject_id}" มีอยู่ในระบบแล้ว`);
            } else {
                req.flash('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
            return res.redirect('/subjects/add');
        }
        req.flash('success', `เพิ่มวิชา ${subject_name} สำเร็จ`);
        res.redirect('/subjects');
    });
};

// GET /subjects/:id/edit
const getEdit = (req, res) => {
    const { id } = req.params;
    const subjectSql = 'SELECT * FROM Subjects WHERE subject_id = ?';
    const teachersSql = 'SELECT teacher_id, first_name, last_name FROM Teachers ORDER BY first_name ASC';

    db.get(subjectSql, [id], (err, subject) => {
        if (err || !subject) {
            req.flash('error', 'ไม่พบข้อมูลวิชา');
            return res.redirect('/subjects');
        }
        db.all(teachersSql, [], (err2, teachers) => {
            res.render('subjects/edit', {
                title: 'แก้ไขข้อมูลวิชา',
                subject,
                teachers: err2 ? [] : teachers
            });
        });
    });
};

// POST /subjects/:id/edit
const postEdit = (req, res) => {
    const { id } = req.params;
    const { subject_name, grade_level, credit, teacher_id } = req.body;

    if (!subject_name || !grade_level || !credit) {
        req.flash('error', 'กรุณากรอกชื่อวิชา ระดับชั้น และหน่วยกิต');
        return res.redirect(`/subjects/${id}/edit`);
    }

    const sql = `UPDATE Subjects SET subject_name=?, grade_level=?, credit=?, teacher_id=?
                 WHERE subject_id=?`;
    const params = [subject_name.trim(), parseInt(grade_level), parseInt(credit), teacher_id || null, id];

    db.run(sql, params, function (err) {
        if (err) {
            req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            return res.redirect(`/subjects/${id}/edit`);
        }
        req.flash('success', `อัปเดตวิชา ${subject_name} สำเร็จ`);
        res.redirect('/subjects');
    });
};

// POST /subjects/:id/delete
const deleteSubject = (req, res) => {
    const { id } = req.params;
    db.get('SELECT subject_name FROM Subjects WHERE subject_id = ?', [id], (err, subject) => {
        if (err || !subject) {
            req.flash('error', 'ไม่พบวิชาที่ต้องการลบ');
            return res.redirect('/subjects');
        }
        db.run('DELETE FROM Subjects WHERE subject_id = ?', [id], function (err2) {
            if (err2) {
                req.flash('error', 'ไม่สามารถลบได้ เนื่องจากวิชานี้ถูกใช้งานอยู่ในระบบ');
            } else {
                req.flash('success', `ลบวิชา ${subject.subject_name} สำเร็จ`);
            }
            res.redirect('/subjects');
        });
    });
};

module.exports = { getAll, getAdd, postAdd, getEdit, postEdit, deleteSubject };
