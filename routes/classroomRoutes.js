const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/login');
};

router.get('/', isAuthenticated, classroomController.getAll);
router.get('/add', isAuthenticated, classroomController.getAdd);
router.post('/add', isAuthenticated, classroomController.postAdd);
router.get('/:id/edit', isAuthenticated, classroomController.getEdit);
router.post('/:id/edit', isAuthenticated, classroomController.postEdit);
router.post('/:id/delete', isAuthenticated, classroomController.deleteClassroom);

module.exports = router;
