const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/teacherGradeController');

router.get('/',           gradeController.getIndex);
router.get('/mark',       gradeController.getMark);
router.post('/mark',      gradeController.postMark);

module.exports = router;
