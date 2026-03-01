const express = require('express');
const router = express.Router();
const { getDashboard, getGrades, getAttendance } = require('../controllers/studentPortalController');

// requireStudent ถูก mount ไว้แล้วที่ app.js ก่อน use('/student', ...)
router.get('/dashboard',   getDashboard);
router.get('/grades',      getGrades);
router.get('/attendance',  getAttendance);

module.exports = router;
