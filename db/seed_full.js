/**
 * seed_full.js — Full mock data seeder
 * Clears ALL tables and inserts realistic demo data.
 * Run: node db/seed_full.js
 *
 * Accounts (all roles use password 123456, except Admin = admin1234):
 *   Admin:   admin / admin1234
 *   Teacher: teacher1–teacher10 / 123456
 *   Student: student1–student50 / 123456
 */

const bcrypt  = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'hsm.db'));

// ─── Promise helpers ──────────────────────────────────────────────────────────
const run = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.run(sql, params, function (err) {
            if (err) reject(err); else resolve(this);
        })
    );

// ─── Data definitions ─────────────────────────────────────────────────────────

const TEACHER_NAMES = [
    ['สมชาย',   'ใจดี'],
    ['วิภา',     'แสงสว่าง'],
    ['ประเสริฐ', 'มั่นคง'],
    ['นงนุช',   'สุขสมบูรณ์'],
    ['ธนากร',   'วงศ์สุวรรณ'],
    ['สุนิสา',   'พรหมดิษฐ์'],
    ['อนุชา',   'สิริพงษ์'],
    ['กาญจนา',  'เจริญรัตน์'],
    ['ณรงค์',   'ทองคำ'],
    ['รัตนา',   'บุญมี'],
];

const STUDENT_FIRST = [
    'อรอุมา','ปิยะ','กมลชนก','ณัฐวุฒิ','สิริมา',
    'ภูมิพัฒน์','นภาพร','วรรณภา','ธนพล','ชนิดา',
    'กิตติพงษ์','อัญชลี','วีรภัทร','พิชญา','สุทธิพงษ์',
    'มณีรัตน์','ปราโมทย์','กัลยาณี','ศุภชัย','ลลิตา',
    'ณัฐพล','สุภาวดี','ชัยวัฒน์','ปิยนุช','อภิชาติ',
    'วนิดา','ทักษิณ','จิตรา','สมศักดิ์','นฤมล',
    'ภัทรพล','อาทิตยา','ศักดิ์ดา','พรรณิภา','รัชพล',
    'นันทิดา','อดิศร','สิรินทร์','ชาคริต','ปัทมา',
    'ธีรภัทร','ชุติมา','พิเชษฐ','นิภาพร','อิทธิพล',
    'กนกวรรณ','วันชนะ','สาวิตรี','ภคพล','อรพิน',
];

const STUDENT_LAST = [
    'สมบูรณ์','แก้วใส','ทองดี','รักษาดี','พงษ์ศิริ',
    'วัฒนา','ชัยชนะ','บุญรักษา','ศรีสุข','มีสุข',
    'โชติรัตน์','ดวงดี','สุขใจ','นามวงศ์','พงษ์พิพัฒน์',
    'ดีเลิศ','ใจกว้าง','สว่างใจ','คงดี','แสนดี',
    'ปิ่นทอง','วงศ์สาย','จันทรา','อินทร์แก้ว','พูลสวัสดิ์',
    'เพชรรัตน์','ศิริมา','ภิรมย์','ชวนชม','สดใส',
    'ผลดี','กาญจนา','นวลจันทร์','ทิพย์รัตน์','ฉัตรชัย',
    'แก้วมณี','บุญธรรม','เจริญสุข','ปิ่นแก้ว','สีสุก',
    'ประเสริฐ','งามดี','เจริญผล','ตรงดี','ชาตรี',
    'รัตนโกสินทร์','บริสุทธิ์','หาญกล้า','สุขสวัสดิ์','มั่นใจ',
];

const ROOMS = [
    { name: 'ม.1/1', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 1/1', grade: 1 },
    { name: 'ม.1/2', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 1/2', grade: 1 },
    { name: 'ม.1/3', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 1/3', grade: 1 },
    { name: 'ม.1/4', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 1/4', grade: 1 },
    { name: 'ม.1/5', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 1/5', grade: 1 },
    { name: 'ม.2/1', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 2/1', grade: 2 },
    { name: 'ม.2/2', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 2/2', grade: 2 },
    { name: 'ม.2/3', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 2/3', grade: 2 },
    { name: 'ม.2/4', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 2/4', grade: 2 },
    { name: 'ม.2/5', desc: 'ห้องเรียนมัธยมศึกษาปีที่ 2/5', grade: 2 },
];

// 5 วิชาสำหรับ ม.1, 5 วิชาสำหรับ ม.2
// teacherIndex = ลำดับของครูที่จะสอนวิชานั้น (0-based)
const SUBJECTS = [
    { id: 'MATH101', name: 'คณิตศาสตร์ 1',  grade: 1, credit: 3, teacherIdx: 0 },
    { id: 'THAI101', name: 'ภาษาไทย 1',      grade: 1, credit: 3, teacherIdx: 1 },
    { id: 'SCI101',  name: 'วิทยาศาสตร์ 1',  grade: 1, credit: 3, teacherIdx: 2 },
    { id: 'ENG101',  name: 'ภาษาอังกฤษ 1',   grade: 1, credit: 3, teacherIdx: 3 },
    { id: 'PE101',   name: 'พลศึกษา 1',       grade: 1, credit: 1, teacherIdx: 4 },
    { id: 'MATH201', name: 'คณิตศาสตร์ 2',  grade: 2, credit: 3, teacherIdx: 5 },
    { id: 'THAI201', name: 'ภาษาไทย 2',      grade: 2, credit: 3, teacherIdx: 6 },
    { id: 'SCI201',  name: 'วิทยาศาสตร์ 2',  grade: 2, credit: 3, teacherIdx: 7 },
    { id: 'ENG201',  name: 'ภาษาอังกฤษ 2',   grade: 2, credit: 3, teacherIdx: 8 },
    { id: 'CS201',   name: 'คอมพิวเตอร์ 2',  grade: 2, credit: 2, teacherIdx: 9 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// คืน array ของวันทำงาน (จ-ศ) ย้อนหลัง n วัน
function getPastWorkdays(n) {
    const days = [];
    const d = new Date();
    // ถอยกลับ 1 วันก่อนเสมอ (ไม่รวมวันนี้เพื่อให้ teacher เห็น history)
    d.setDate(d.getDate() - 1);
    while (days.length < n) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) {
            days.push(d.toISOString().split('T')[0]);
        }
        d.setDate(d.getDate() - 1);
    }
    return days;
}

function randStatus() {
    const r = Math.random();
    if (r < 0.78) return 'Present';
    if (r < 0.90) return 'Late';
    return 'Absent';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
    try {
        console.log('🌱 เริ่ม Full Seed...\n');

        // ── 1. ล้างข้อมูลทั้งหมด (ปิด FK ชั่วคราว) ──────────────────────────
        await run('PRAGMA foreign_keys = OFF');
        const tables = [
            'Attendance', 'Grade_Entries',
            'Exam_Schedule_Entries', 'Exam_Schedule',
            'Schedule', 'Subjects',
            'Students', 'Teachers',
            'Rooms', 'Users', 'Year',
        ];
        for (const t of tables) {
            await run(`DELETE FROM ${t}`);
            // Reset autoincrement counters
            await run(`DELETE FROM sqlite_sequence WHERE name = ?`, [t]).catch(() => {});
        }
        await run('PRAGMA foreign_keys = ON');
        console.log('✓ ล้างข้อมูลเก่าทั้งหมดแล้ว');

        // ── 2. Year ────────────────────────────────────────────────────────────
        await run('INSERT OR IGNORE INTO Year (year) VALUES (?)', [2025]);

        // ── 3. Admin ───────────────────────────────────────────────────────────
        const adminHash = await bcrypt.hash('admin1234', 10);
        await run('INSERT INTO Users (username, password, role) VALUES (?,?,?)',
            ['admin', adminHash, 'Admin']);
        console.log('✓ Admin  : admin / admin1234');

        // ── 4. Rooms ───────────────────────────────────────────────────────────
        const roomIds = [];
        for (const r of ROOMS) {
            const res = await run(
                'INSERT INTO Rooms (room_name, description, status, grade_level) VALUES (?,?,?,?)',
                [r.name, r.desc, 'In-used', r.grade]
            );
            roomIds.push(res.lastID);
        }
        console.log(`✓ Rooms  : ${ROOMS.map(r => r.name).join(', ')}`);

        // ── 5. Teachers ────────────────────────────────────────────────────────
        const teacherIds = [];
        const pwHash = await bcrypt.hash('123456', 10);
        for (let i = 0; i < 10; i++) {
            const uRes = await run(
                'INSERT INTO Users (username, password, role) VALUES (?,?,?)',
                [`teacher${i + 1}`, pwHash, 'Teacher']
            );
            const [fn, ln] = TEACHER_NAMES[i];
            const tRes = await run(
                'INSERT INTO Teachers (first_name, last_name, phone, email, user_id) VALUES (?,?,?,?,?)',
                [fn, ln, `08${i}0${String(i).padStart(6, '0')}`, `teacher${i + 1}@school.ac.th`, uRes.lastID]
            );
            teacherIds.push(tRes.lastID);
        }
        console.log('✓ Teachers: teacher1–teacher10 / 123456');

        // ── 6. Subjects ────────────────────────────────────────────────────────
        for (const s of SUBJECTS) {
            await run(
                'INSERT INTO Subjects (subject_id, subject_name, grade_level, credit, teacher_id) VALUES (?,?,?,?,?)',
                [s.id, s.name, s.grade, s.credit, teacherIds[s.teacherIdx]]
            );
        }
        console.log(`✓ Subjects: ${SUBJECTS.map(s => s.name).join(', ')}`);

        // ── 7. Students (50 คน, กระจาย 10 ห้องๆ ละ 5 คน) ────────────────────
        const studentIds = [];
        for (let i = 0; i < 50; i++) {
            const uRes = await run(
                'INSERT INTO Users (username, password, role) VALUES (?,?,?)',
                [`student${i + 1}`, pwHash, 'Student']
            );
            // i%10 → room index 0..9 (each room gets students i=0,10,20,30,40 / 1,11,21,31,41 / ...)
            const roomId = roomIds[i % 10];
            const dobYear = 2007 + (i % 3); // อายุ 16-18 ปี
            const dobMonth = String((i % 12) + 1).padStart(2, '0');
            const dobDay   = String((i % 28) + 1).padStart(2, '0');

            const sRes = await run(
                `INSERT INTO Students
                 (first_name, last_name, phone, sex, nationality, email,
                  room_id, semester, year, user_id, citizen_id, dob, enroll_year)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    STUDENT_FIRST[i], STUDENT_LAST[i],
                    `08${String(i).padStart(8, '0')}`,
                    i % 2 === 0 ? 'Female' : 'Male',
                    'Thai',
                    `student${i + 1}@school.ac.th`,
                    roomId, 1, 2025, uRes.lastID,
                    String(1000000000000 + i),   // 13-digit citizen ID
                    `${dobYear}-${dobMonth}-${dobDay}`,
                    2024,
                ]
            );
            studentIds.push(sRes.lastID);
        }
        console.log('✓ Students: student1–student50 / 123456 (ห้องละ 5 คน)');

        // ── 8. Schedules ───────────────────────────────────────────────────────
        // ม.1 rooms (index 0-4) × DAYS × วิชา ม.1 (หมุนเวียน 5 วิชา)
        // ม.2 rooms (index 5-9) × DAYS × วิชา ม.2
        // คาบสอน: หมุนเวียน 1-5 ตามลำดับห้อง เพื่อไม่ให้ซ้ำกันทุกวัน
        const grade1Subs = SUBJECTS.filter(s => s.grade === 1).map(s => s.id); // 5 วิชา
        const grade2Subs = SUBJECTS.filter(s => s.grade === 2).map(s => s.id);
        const grade1Rooms = roomIds.slice(0, 5);
        const grade2Rooms = roomIds.slice(5);
        const SEMESTER = 1, YEAR_VAL = 2025;

        let schedCount = 0;

        for (let ri = 0; ri < 5; ri++) {
            for (let di = 0; di < DAYS.length; di++) {
                // วนวิชาตามดัชนีรวมของห้อง+วัน เพื่อไม่ซ้ำ
                const subjId  = grade1Subs[(ri + di) % grade1Subs.length];
                const period  = ((ri * 2 + di) % 8) + 1; // คาบ 1-8
                await run(
                    'INSERT INTO Schedule (room_id, day, period, type, subject_id, semester, year) VALUES (?,?,?,?,?,?,?)',
                    [grade1Rooms[ri], DAYS[di], period, 'Class', subjId, SEMESTER, YEAR_VAL]
                );
                schedCount++;
            }
        }

        for (let ri = 0; ri < 5; ri++) {
            for (let di = 0; di < DAYS.length; di++) {
                const subjId = grade2Subs[(ri + di) % grade2Subs.length];
                const period = ((ri * 2 + di + 3) % 8) + 1;
                await run(
                    'INSERT INTO Schedule (room_id, day, period, type, subject_id, semester, year) VALUES (?,?,?,?,?,?,?)',
                    [grade2Rooms[ri], DAYS[di], period, 'Class', subjId, SEMESTER, YEAR_VAL]
                );
                schedCount++;
            }
        }

        console.log(`✓ Schedules: ${schedCount} คาบ (วันจันทร์–ศุกร์)`);

        // ── 9. Attendance (10 วันทำงานย้อนหลัง) ──────────────────────────────
        const workdays = getPastWorkdays(10);
        let attCount = 0;

        for (const sid of studentIds) {
            for (const d of workdays) {
                await run(
                    'INSERT OR IGNORE INTO Attendance (student_id, date, status) VALUES (?,?,?)',
                    [sid, d, randStatus()]
                );
                attCount++;
            }
        }
        console.log(`✓ Attendance: ${attCount} records (${workdays.length} วันย้อนหลัง, 50 นักเรียน)`);

        // ── Summary ────────────────────────────────────────────────────────────
        console.log('\n✅ Seed สำเร็จ!\n');
        console.log('  ┌─────────────────────────────────────────┐');
        console.log('  │  บัญชีที่ใช้งานได้                      │');
        console.log('  ├─────────────────────────────────────────┤');
        console.log('  │  Admin   : admin        / admin1234     │');
        console.log('  │  Teacher : teacher1–10  / 123456        │');
        console.log('  │  Student : student1–50  / 123456        │');
        console.log('  └─────────────────────────────────────────┘');

    } catch (err) {
        console.error('\n❌ Seed Error:', err.message);
        console.error(err);
    } finally {
        db.close();
    }
})();
