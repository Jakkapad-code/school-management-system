const db = require('../db/database');

const DAY_ORDER = `CASE day
    WHEN 'Monday'    THEN 1 WHEN 'Tuesday'  THEN 2 WHEN 'Wednesday' THEN 3
    WHEN 'Thursday'  THEN 4 WHEN 'Friday'   THEN 5 WHEN 'Saturday'  THEN 6
    WHEN 'Sunday'    THEN 7 END`;

// GET /teacher/dashboard
const getDashboard = (req, res) => {
    const userId = req.user.user_id;

    // หาข้อมูลครูที่ผูกกับ user นี้
    db.get('SELECT * FROM Teachers WHERE user_id = ?', [userId], (err, teacher) => {
        if (err || !teacher) {
            // login เป็น Teacher role แต่ไม่มี record ใน Teachers
            return res.render('portal/teacher/dashboard', {
                title: 'หน้าหลัก',
                teacher: null,
                schedulesByDay: {},
                totalPeriods: 0
            });
        }

        const sql = `
            SELECT sc.ID, sc.day, sc.period, sc.type, sc.semester, sc.year,
                   r.room_name,
                   s.subject_id, s.subject_name, s.grade_level, s.credit
            FROM Schedule sc
            LEFT JOIN Rooms    r ON sc.room_id    = r.room_id
            LEFT JOIN Subjects s ON sc.subject_id = s.subject_id
            WHERE s.teacher_id = ?
            ORDER BY ${DAY_ORDER}, sc.period ASC
        `;

        db.all(sql, [teacher.teacher_id], (err2, schedules) => {
            const rows = err2 ? [] : schedules;

            // จัดกลุ่มตามวัน
            const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const schedulesByDay = {};
            DAY_KEYS.forEach(d => { schedulesByDay[d] = []; });
            rows.forEach(sc => {
                if (schedulesByDay[sc.day]) schedulesByDay[sc.day].push(sc);
            });

            res.render('portal/teacher/dashboard', {
                title: 'หน้าหลัก',
                teacher,
                schedulesByDay,
                totalPeriods: rows.length
            });
        });
    });
};

module.exports = { getDashboard };
