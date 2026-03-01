const db = require('../db/database');

function calcLetterGrade(total) {
    if (total >= 80) return 'A';
    if (total >= 75) return 'B+';
    if (total >= 70) return 'B';
    if (total >= 65) return 'C+';
    if (total >= 60) return 'C';
    if (total >= 55) return 'D+';
    if (total >= 50) return 'D';
    return 'F';
}

// GET /teacher/grades — แสดงวิชาที่ครูสอน (distinct subject+semester+year)
const getIndex = (req, res) => {
    const userId = req.user.user_id;

    db.get('SELECT * FROM Teachers WHERE user_id = ?', [userId], (err, teacher) => {
        if (err || !teacher) {
            return res.render('portal/teacher/grades/index', {
                title: 'บันทึกคะแนน', teacher: null, subjects: []
            });
        }

        const sql = `
            SELECT DISTINCT s.subject_id, s.subject_name, s.grade_level, s.credit,
                   sc.semester, sc.year,
                   GROUP_CONCAT(DISTINCT r.room_name) AS room_names
            FROM Schedule sc
            JOIN Subjects s ON sc.subject_id = s.subject_id
            LEFT JOIN Rooms r ON sc.room_id = r.room_id
            WHERE s.teacher_id = ?
            GROUP BY s.subject_id, sc.semester, sc.year
            ORDER BY sc.year DESC, sc.semester DESC, s.subject_name ASC
        `;

        db.all(sql, [teacher.teacher_id], (err2, subjects) => {
            res.render('portal/teacher/grades/index', {
                title: 'บันทึกคะแนน',
                teacher,
                subjects: err2 ? [] : subjects
            });
        });
    });
};

// GET /teacher/grades/mark?subject_id=X&semester=Y&year=Z
const getMark = (req, res) => {
    const userId = req.user.user_id;
    const { subject_id, semester, year } = req.query;

    if (!subject_id || !semester || !year) return res.redirect('/teacher/grades');

    db.get('SELECT * FROM Teachers WHERE user_id = ?', [userId], (err, teacher) => {
        if (err || !teacher) return res.redirect('/teacher/grades');

        db.get('SELECT * FROM Subjects WHERE subject_id = ?', [subject_id], (err2, subject) => {
            if (err2 || !subject) {
                req.flash('error', 'ไม่พบวิชานี้');
                return res.redirect('/teacher/grades');
            }

            // หาห้องที่สอนวิชานี้ในเทอม/ปีนี้
            const roomSql = `
                SELECT DISTINCT r.room_id, r.room_name
                FROM Schedule sc
                JOIN Rooms r ON sc.room_id = r.room_id
                WHERE sc.subject_id = ? AND sc.semester = ? AND sc.year = ?
            `;

            db.all(roomSql, [subject_id, parseInt(semester), parseInt(year)], (err3, rooms) => {
                const roomIds = rooms ? rooms.map(r => r.room_id) : [];

                if (roomIds.length === 0) {
                    return res.render('portal/teacher/grades/mark', {
                        title: 'บันทึกคะแนน', teacher, subject,
                        semester: parseInt(semester), year: parseInt(year),
                        students: [], gradeMap: {}
                    });
                }

                // ดึงนักเรียนในห้องเหล่านั้น
                const placeholders = roomIds.map(() => '?').join(',');
                const studentSql = `
                    SELECT st.student_id, st.first_name, st.last_name, r.room_name
                    FROM Students st
                    LEFT JOIN Rooms r ON st.room_id = r.room_id
                    WHERE st.room_id IN (${placeholders})
                    ORDER BY r.room_name ASC, st.first_name ASC
                `;

                db.all(studentSql, roomIds, (err4, students) => {
                    const studs = err4 ? [] : students;

                    if (studs.length === 0) {
                        return res.render('portal/teacher/grades/mark', {
                            title: 'บันทึกคะแนน', teacher, subject,
                            semester: parseInt(semester), year: parseInt(year),
                            students: [], gradeMap: {}
                        });
                    }

                    // ดึงคะแนนที่บันทึกไว้แล้ว
                    const studentIds = studs.map(s => s.student_id);
                    const gradePH = studentIds.map(() => '?').join(',');
                    const gradeSql = `
                        SELECT * FROM Grade_Entries
                        WHERE subject_id = ? AND semester = ? AND year = ?
                        AND student_id IN (${gradePH})
                    `;

                    db.all(gradeSql, [subject_id, parseInt(semester), parseInt(year), ...studentIds], (err5, grades) => {
                        const gradeMap = {};
                        if (grades) grades.forEach(g => { gradeMap[g.student_id] = g; });

                        res.render('portal/teacher/grades/mark', {
                            title: 'บันทึกคะแนน', teacher, subject,
                            semester: parseInt(semester), year: parseInt(year),
                            students: studs, gradeMap
                        });
                    });
                });
            });
        });
    });
};

// POST /teacher/grades/mark
const postMark = (req, res) => {
    const userId = req.user.user_id;
    const { subject_id, semester, year, grades } = req.body;

    if (!subject_id || !semester || !year) {
        req.flash('error', 'ข้อมูลไม่ครบถ้วน');
        return res.redirect('/teacher/grades');
    }

    db.get('SELECT * FROM Teachers WHERE user_id = ?', [userId], (err, teacher) => {
        if (err || !teacher) return res.redirect('/teacher/grades');

        const redirectUrl = `/teacher/grades/mark?subject_id=${subject_id}&semester=${semester}&year=${year}`;

        if (!grades || Object.keys(grades).length === 0) {
            req.flash('success', 'บันทึกคะแนนสำเร็จ');
            return res.redirect(redirectUrl);
        }

        const studentIds = Object.keys(grades);
        let processed = 0;
        let hasError = false;

        const finish = () => {
            processed++;
            if (processed === studentIds.length) {
                req.flash(hasError ? 'error' : 'success',
                    hasError ? 'บันทึกบางรายการไม่สำเร็จ' : 'บันทึกคะแนนสำเร็จทุกรายการ');
                res.redirect(redirectUrl);
            }
        };

        studentIds.forEach(studentId => {
            const g = grades[studentId] || {};
            const continuous = Math.min(Math.max(parseInt(g.continuous) || 0, 0), 30);
            const midterm    = Math.min(Math.max(parseInt(g.midterm)    || 0, 0), 30);
            const final      = Math.min(Math.max(parseInt(g.final)      || 0, 0), 40);
            const total      = continuous + midterm + final;
            const letter     = calcLetterGrade(total);

            db.get(
                'SELECT grade_id FROM Grade_Entries WHERE student_id = ? AND subject_id = ? AND semester = ? AND year = ?',
                [studentId, subject_id, parseInt(semester), parseInt(year)],
                (err2, existing) => {
                    if (existing) {
                        db.run(
                            `UPDATE Grade_Entries
                             SET grade = ?, score_continuous = ?, score_midterm = ?, score_final = ?, letter_grade = ?
                             WHERE grade_id = ?`,
                            [total, continuous, midterm, final, letter, existing.grade_id],
                            (err3) => { if (err3) hasError = true; finish(); }
                        );
                    } else {
                        db.run(
                            `INSERT INTO Grade_Entries
                             (student_id, subject_id, semester, year, grade, score_continuous, score_midterm, score_final, letter_grade)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [studentId, subject_id, parseInt(semester), parseInt(year), total, continuous, midterm, final, letter],
                            (err3) => { if (err3) hasError = true; finish(); }
                        );
                    }
                }
            );
        });
    });
};

module.exports = { getIndex, getMark, postMark };
