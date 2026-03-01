const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path');

const hi = require('./helpers/icons');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Middleware Setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 3. Session Store (SQLite)
const SQLiteStore = require('connect-sqlite3')(session);

app.use(session({
    secret: 'A_SUPER_SECRET_KEY_FOR_HIGH_SCHOOL_APP',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') })
}));

// 4. Flash Messages
app.use(flash());

// 5. Passport Initialization
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// 6. Global Template Variables
app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.hi = hi;
    next();
});

// 6.5 DB Migration — เพิ่ม columns ใน Grade_Entries (ถ้ายังไม่มี)
const db = require('./db/database');
[
    'ALTER TABLE Grade_Entries ADD COLUMN score_continuous INTEGER DEFAULT 0',
    'ALTER TABLE Grade_Entries ADD COLUMN score_midterm    INTEGER DEFAULT 0',
    'ALTER TABLE Grade_Entries ADD COLUMN score_final      INTEGER DEFAULT 0',
    'ALTER TABLE Grade_Entries ADD COLUMN letter_grade     TEXT',
].forEach(sql => db.run(sql, [], () => {})); // ignore "duplicate column" errors

// 7. Routes
const { requireAdmin, requireTeacher, requireStudent } = require('./middleware/auth');

const authRoutes           = require('./routes/authRoutes');
const teacherRoutes        = require('./routes/teacherRoutes');
const studentRoutes        = require('./routes/studentRoutes');
const subjectRoutes        = require('./routes/subjectRoutes');
const classroomRoutes      = require('./routes/classroomRoutes');
const scheduleRoutes       = require('./routes/scheduleRoutes');
const teacherPortalRoutes  = require('./routes/teacherPortalRoutes');
const teacherGradeRoutes   = require('./routes/teacherGradeRoutes');
const studentPortalRoutes  = require('./routes/studentPortalRoutes');

app.use('/', authRoutes);

// Admin-only routes
app.use('/teachers',   requireAdmin, teacherRoutes);
app.use('/students',   requireAdmin, studentRoutes);
app.use('/subjects',   requireAdmin, subjectRoutes);
app.use('/classrooms', requireAdmin, classroomRoutes);
app.use('/schedules',  requireAdmin, scheduleRoutes);

// Teacher portal routes
app.use('/teacher', requireTeacher, teacherPortalRoutes);
app.use('/teacher/grades', requireTeacher, teacherGradeRoutes);

// Student portal routes
app.use('/student', requireStudent, studentPortalRoutes);

// Home → redirect to role-appropriate dashboard
app.get('/', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (req.user.role === 'Teacher') return res.redirect('/teacher/dashboard');
    if (req.user.role === 'Student') return res.redirect('/student/dashboard');
    res.redirect('/dashboard');
});

// Admin Dashboard (protected)
app.get('/dashboard', requireAdmin, (req, res) => {
    res.render('dashboard', { title: 'Dashboard' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// 8. Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
