const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// Middleware ตรวจสอบการเข้าสู่ระบบ
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/login');
};

router.get('/', isAuthenticated, teacherController.getAll);
router.get('/add', isAuthenticated, teacherController.getAdd);
router.post('/add', isAuthenticated, teacherController.postAdd);
router.get('/:id/edit', isAuthenticated, teacherController.getEdit);
router.post('/:id/edit', isAuthenticated, teacherController.postEdit);
router.post('/:id/delete', isAuthenticated, teacherController.deleteTeacher);

module.exports = router;
