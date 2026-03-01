/**
 * Shared auth middleware
 */

// ตรวจสอบแค่ว่า login อยู่หรือเปล่า
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/login');
};

// เฉพาะ Admin เท่านั้น
const requireAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
        return res.redirect('/login');
    }
    if (req.user.role === 'Admin') return next();

    // ไม่ใช่ Admin → ส่งกลับ dashboard ที่เหมาะสม
    req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    if (req.user.role === 'Teacher') return res.redirect('/teacher/dashboard');
    if (req.user.role === 'Student') return res.redirect('/student/dashboard');
    res.redirect('/login');
};

// เฉพาะ Teacher เท่านั้น
const requireTeacher = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
        return res.redirect('/login');
    }
    if (req.user.role === 'Teacher') return next();

    req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    if (req.user.role === 'Admin') return res.redirect('/dashboard');
    if (req.user.role === 'Student') return res.redirect('/student/dashboard');
    res.redirect('/login');
};

// เฉพาะ Student เท่านั้น
const requireStudent = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
        return res.redirect('/login');
    }
    if (req.user.role === 'Student') return next();

    req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    if (req.user.role === 'Admin') return res.redirect('/dashboard');
    if (req.user.role === 'Teacher') return res.redirect('/teacher/dashboard');
    res.redirect('/login');
};

module.exports = { isAuthenticated, requireAdmin, requireTeacher, requireStudent };
