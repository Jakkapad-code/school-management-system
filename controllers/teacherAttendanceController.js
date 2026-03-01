const db = require('../db/database');

const DAY_ORDER = `CASE day
    WHEN 'Monday'    THEN 1 WHEN 'Tuesday'  THEN 2 WHEN 'Wednesday' THEN 3
    WHEN 'Thursday'  THEN 4 WHEN 'Friday'   THEN 5 WHEN 'Saturday'  THEN 6
    WHEN 'Sunday'    THEN 7 END`;

// GET /teacher/attendance
// แสดงรายการคาบสอนของครู ให้เลือกเพื่อเช็คชื่อ
const getIndex = (req, res) => {
    const userId = req.user.user_id;

    db.get('SELECT * FROM Teachers WHERE user_id = ?', [userId], (err, teacher) => {
        if (err || !teacher) {
            return res.render('portal/teacher/attendance/index', {
                title: 'เช็คชื่อ',
                teacher: null,
                schedules: []
            });
        }

        const sql = `
            SELECT sc.ID, sc.day, sc.period, sc.type, sc.semester, sc.year,
                   r.room_id, r.room_name,
                   s.subject_id, s.subject_name, s.grade_level
            FROM Schedule sc
            LEFT JOIN Rooms    r ON sc.room_id    = r.room_id
            LEFT JOIN Subjects s ON sc.subject_id = s.subject_id
            WHERE s.teacher_id = ?
            ORDER BY ${DAY_ORDER}, sc.period ASC
        `;

        db.all(sql, [teacher.teacher_id], (err2, schedules) => {
            res.render('portal/teacher/attendance/index', {
                title: 'เช็คชื่อ',
                teacher,
                schedules: err2 ? [] : schedules
            });
        });
    });
};

// GET /teacher/attendance/mark?schedule_id=X&date=YYYY-MM-DD
// แสดงฟอร์มเช็คชื่อนักเรียนในห้องนั้น
const getMark = (req, res) => {
    const { schedule_id, date } = req.query;

    if (!schedule_id || !date) {
        req.flash('error', 'ข้อมูลไม่ครบถ้วน กรุณาเลือกคาบสอนและวันที่');
        return res.redirect('/teacher/attendance');
    }

    // ดึงข้อมูลคาบสอน
    const scheduleSql = `
        SELECT sc.ID, sc.day, sc.period, sc.type, sc.semester, sc.year,
               r.room_id, r.room_name,
               s.subject_id, s.subject_name, s.grade_level
        FROM Schedule sc
        LEFT JOIN Rooms    r ON sc.room_id    = r.room_id
        LEFT JOIN Subjects s ON sc.subject_id = s.subject_id
        WHERE sc.ID = ?
    `;

    db.get(scheduleSql, [schedule_id], (err, schedule) => {
        if (err || !schedule) {
            req.flash('error', 'ไม่พบข้อมูลคาบสอน');
            return res.redirect('/teacher/attendance');
        }

        // ดึงนักเรียนในห้อง
        const studentSql = `
            SELECT st.student_id, st.first_name, st.last_name
            FROM Students st
            WHERE st.room_id = ?
            ORDER BY st.first_name, st.last_name
        `;

        db.all(studentSql, [schedule.room_id], (err2, students) => {
            if (err2) {
                req.flash('error', 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน');
                return res.redirect('/teacher/attendance');
            }

            if (students.length === 0) {
                req.flash('error', 'ไม่มีนักเรียนในห้องนี้');
                return res.redirect('/teacher/attendance');
            }

            // ดึงข้อมูลการเข้าเรียนของวันนั้น (ถ้ามี)
            const studentIds = students.map(s => s.student_id);
            const placeholders = studentIds.map(() => '?').join(',');
            const attendanceSql = `
                SELECT student_id, status
                FROM Attendance
                WHERE student_id IN (${placeholders}) AND date = ?
            `;

            db.all(attendanceSql, [...studentIds, date], (err3, existing) => {
                const attendanceMap = {};
                if (!err3) {
                    existing.forEach(a => { attendanceMap[a.student_id] = a.status; });
                }

                res.render('portal/teacher/attendance/mark', {
                    title: 'เช็คชื่อ',
                    schedule,
                    students,
                    attendanceMap,
                    date
                });
            });
        });
    });
};

// POST /teacher/attendance/mark
// บันทึก/อัปเดตการเช็คชื่อ
const postMark = (req, res) => {
    const { schedule_id, date, attendance } = req.body;
    // attendance = { "1": "Present", "2": "Absent", ... }

    if (!schedule_id || !date || !attendance) {
        req.flash('error', 'ข้อมูลไม่ครบถ้วน');
        return res.redirect('/teacher/attendance');
    }

    const entries = Object.entries(attendance); // [[student_id, status], ...]

    if (entries.length === 0) {
        req.flash('error', 'ไม่มีข้อมูลการเช็คชื่อ');
        return res.redirect(`/teacher/attendance/mark?schedule_id=${schedule_id}&date=${date}`);
    }

    // Validate status values
    const validStatuses = ['Present', 'Absent', 'Late'];
    const invalid = entries.some(([, status]) => !validStatuses.includes(status));
    if (invalid) {
        req.flash('error', 'สถานะการเข้าเรียนไม่ถูกต้อง');
        return res.redirect(`/teacher/attendance/mark?schedule_id=${schedule_id}&date=${date}`);
    }

    // Upsert แต่ละ record
    const upsertSql = `
        INSERT INTO Attendance (student_id, date, status)
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
    `;

    let completed = 0;
    let hasError = false;

    entries.forEach(([studentId, status]) => {
        db.run(upsertSql, [studentId, date, status], (err) => {
            if (err) hasError = true;
            completed++;
            if (completed === entries.length) {
                if (hasError) {
                    req.flash('error', 'เกิดข้อผิดพลาดบางส่วนในการบันทึก');
                } else {
                    req.flash('success', `บันทึกการเช็คชื่อ ${entries.length} คน เรียบร้อยแล้ว`);
                }
                res.redirect(`/teacher/attendance/mark?schedule_id=${schedule_id}&date=${date}`);
            }
        });
    });
};

module.exports = { getIndex, getMark, postMark };
