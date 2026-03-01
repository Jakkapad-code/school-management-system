const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/teacherPortalController');
const { getIndex, getMark, postMark } = require('../controllers/teacherAttendanceController');

// requireTeacher ถูก mount ไว้แล้วที่ app.js ก่อน use('/teacher', ...)
router.get('/dashboard', getDashboard);

// Attendance routes
router.get('/attendance',      getIndex);
router.get('/attendance/mark', getMark);
router.post('/attendance/mark', postMark);

module.exports = router;
