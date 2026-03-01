/**
 * Auth Controller (controllers/authController.js)
 * Handles login and logout logic.
 */

const passport = require('passport');

// ส่ง user ไป dashboard ที่ถูกต้องตาม role
const redirectByRole = (res, role) => {
    if (role === 'Admin')   return res.redirect('/dashboard');
    if (role === 'Teacher') return res.redirect('/teacher/dashboard');
    if (role === 'Student') return res.redirect('/student/dashboard');
    return res.redirect('/login');
};

// GET /login
const getLogin = (req, res) => {
    if (req.isAuthenticated()) {
        return redirectByRole(res, req.user.role);
    }
    res.render('login', { title: 'Login' });
};

// POST /login — custom callback เพื่อ redirect ตาม role
const postLogin = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error', info?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return redirectByRole(res, user.role);
        });
    })(req, res, next);
};

// GET /logout
const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success', 'You have been logged out.');
        res.redirect('/login');
    });
};

module.exports = { getLogin, postLogin, logout };
