const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/login');
};

router.get('/',            isAuthenticated, scheduleController.getAll);
router.get('/add',         isAuthenticated, scheduleController.getAdd);
router.post('/add',        isAuthenticated, scheduleController.postAdd);
router.get('/:id/edit',    isAuthenticated, scheduleController.getEdit);
router.post('/:id/edit',   isAuthenticated, scheduleController.postEdit);
router.post('/:id/delete', isAuthenticated, scheduleController.deleteSchedule);

module.exports = router;
