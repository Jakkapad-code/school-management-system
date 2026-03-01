const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/login');
};

router.get('/', isAuthenticated, studentController.getAll);
router.get('/add', isAuthenticated, studentController.getAdd);
router.post('/add', isAuthenticated, studentController.postAdd);
router.get('/:id/edit', isAuthenticated, studentController.getEdit);
router.post('/:id/edit', isAuthenticated, studentController.postEdit);
router.post('/:id/delete', isAuthenticated, studentController.deleteStudent);

module.exports = router;
