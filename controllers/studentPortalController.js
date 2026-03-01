const db = require('../db/database');

const DAY_ORDER = `CASE day
    WHEN 'Monday'    THEN 1 WHEN 'Tuesday'  THEN 2 WHEN 'Wednesday' THEN 3
    WHEN 'Thursday'  THEN 4 WHEN 'Friday'   THEN 5 WHEN 'Saturday'  THEN 6
    WHEN 'Sunday'    THEN 7 END`;

// GET /student/dashboard
const getDashboard = (req, res) => {
    const userId = req.user.user_id;

    // หาข้อมูลนักเรียนที่ผูกกับ user นี้ (join Rooms เพื่อได้ room_name)
    db.get(
        `SELECT st.*, r.room_name, r.grade_level AS room_grade
         FROM Students st
         LEFT JOIN Rooms r ON st.room_id = r.room_id
         WHERE st.user_id = ?`,
        [userId],
        (err, student) => {
            if (err || !student) {
                return res.render('portal/student/dashboard', {
                    title: 'หน้าหลัก',
                    student: null,
                    schedulesByDay: {},
                    totalPeriods: 0
                });
            }

            // ดึง Schedule ของห้องนักเรียน กรองตาม semester + year ปัจจุบัน
            const sql = `
                SELECT sc.ID, sc.day, sc.period, sc.type, sc.semester, sc.year,
                       r.room_name,
                       s.subject_id, s.subject_name, s.grade_level, s.credit,
                       t.first_name AS teacher_first, t.last_name AS teacher_last
                FROM Schedule sc
                LEFT JOIN Rooms    r ON sc.room_id    = r.room_id
                LEFT JOIN Subjects s ON sc.subject_id = s.subject_id
                LEFT JOIN Teachers t ON s.teacher_id  = t.teacher_id
                WHERE sc.room_id = ? AND sc.semester = ? AND sc.year = ?
                ORDER BY ${DAY_ORDER}, sc.period ASC
            `;

            db.all(sql, [student.room_id, student.semester, student.year], (err2, schedules) => {
                const rows = err2 ? [] : schedules;

                const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const schedulesByDay = {};
                DAY_KEYS.forEach(d => { schedulesByDay[d] = []; });
                rows.forEach(sc => {
                    if (schedulesByDay[sc.day]) schedulesByDay[sc.day].push(sc);
                });

                res.render('portal/student/dashboard', {
                    title: 'หน้าหลัก',
                    student,
                    schedulesByDay,
                    totalPeriods: rows.length
                });
            });
        }
    );
};

// แปลงคะแนน (0–100) เป็นเกรดตัวอักษรและ GPA point
function scoreToGrade(score) {
    if (score === null || score === undefined) return { letter: '-', point: null };
    if (score >= 80) return { letter: 'A',  point: 4.0 };
    if (score >= 75) return { letter: 'B+', point: 3.5 };
    if (score >= 70) return { letter: 'B',  point: 3.0 };
    if (score >= 65) return { letter: 'C+', point: 2.5 };
    if (score >= 60) return { letter: 'C',  point: 2.0 };
    if (score >= 55) return { letter: 'D+', point: 1.5 };
    if (score >= 50) return { letter: 'D',  point: 1.0 };
    return { letter: 'F', point: 0.0 };
}

// GET /student/grades
const getGrades = (req, res) => {
    const userId = req.user.user_id;

    db.get(
        `SELECT st.*, r.room_name, r.grade_level AS room_grade
         FROM Students st
         LEFT JOIN Rooms r ON st.room_id = r.room_id
         WHERE st.user_id = ?`,
        [userId],
        (err, student) => {
            if (err || !student) {
                return res.render('portal/student/grades', {
                    title: 'ผลการเรียน',
                    student: null,
                    gradesBySemester: {},
                    semesterKeys: [],
                    gpa: null,
                    totalCredits: 0
                });
            }

            db.all(
                `SELECT ge.grade_id, ge.semester, ge.year, ge.subject_id, ge.grade,
                        s.subject_name, s.credit
                 FROM Grade_Entries ge
                 LEFT JOIN Subjects s ON ge.subject_id = s.subject_id
                 WHERE ge.student_id = ?
                 ORDER BY ge.year DESC, ge.semester DESC, s.subject_id ASC`,
                [student.student_id],
                (err2, rows) => {
                    if (err2) rows = [];

                    // เพิ่มข้อมูลเกรดตัวอักษร
                    rows.forEach(r => {
                        const g = scoreToGrade(r.grade);
                        r.letter = g.letter;
                        r.point  = g.point;
                    });

                    // จัดกลุ่มตาม year/semester
                    const gradesBySemester = {};
                    rows.forEach(r => {
                        const key = `${r.year}-${r.semester}`;
                        if (!gradesBySemester[key]) {
                            gradesBySemester[key] = { year: r.year, semester: r.semester, entries: [] };
                        }
                        gradesBySemester[key].entries.push(r);
                    });

                    // เรียง key ล่าสุดก่อน
                    const semesterKeys = Object.keys(gradesBySemester).sort((a, b) => b.localeCompare(a));

                    // คำนวณ GPA รวมทั้งหมด (weighted by credit)
                    let weightedSum = 0, totalCredits = 0;
                    rows.forEach(r => {
                        if (r.point !== null && r.credit) {
                            weightedSum  += r.point * r.credit;
                            totalCredits += r.credit;
                        }
                    });
                    const gpa = totalCredits > 0
                        ? (weightedSum / totalCredits).toFixed(2)
                        : null;

                    res.render('portal/student/grades', {
                        title: 'ผลการเรียน',
                        student,
                        gradesBySemester,
                        semesterKeys,
                        gpa,
                        totalCredits
                    });
                }
            );
        }
    );
};

// GET /student/attendance
const getAttendance = (req, res) => {
    const userId = req.user.user_id;

    db.get(
        `SELECT st.*, r.room_name, r.grade_level AS room_grade
         FROM Students st
         LEFT JOIN Rooms r ON st.room_id = r.room_id
         WHERE st.user_id = ?`,
        [userId],
        (err, student) => {
            if (err || !student) {
                return res.render('portal/student/attendance', {
                    title: 'สถิติการเข้าเรียน',
                    student: null,
                    summary: { total: 0, present: 0, absent: 0, late: 0 },
                    records: []
                });
            }

            db.all(
                `SELECT date, status FROM Attendance
                 WHERE student_id = ?
                 ORDER BY date DESC`,
                [student.student_id],
                (err2, records) => {
                    if (err2) records = [];

                    const summary = { total: records.length, present: 0, absent: 0, late: 0 };
                    records.forEach(r => {
                        if (r.status === 'Present') summary.present++;
                        else if (r.status === 'Absent') summary.absent++;
                        else if (r.status === 'Late')   summary.late++;
                    });

                    res.render('portal/student/attendance', {
                        title: 'สถิติการเข้าเรียน',
                        student,
                        summary,
                        records
                    });
                }
            );
        }
    );
};

module.exports = { getDashboard, getGrades, getAttendance };
