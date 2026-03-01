const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/login');
};

router.get('/', isAuthenticated, subjectController.getAll);
router.get('/add', isAuthenticated, subjectController.getAdd);
router.post('/add', isAuthenticated, subjectController.postAdd);
router.get('/:id/edit', isAuthenticated, subjectController.getEdit);
router.post('/:id/edit', isAuthenticated, subjectController.postEdit);
router.post('/:id/delete', isAuthenticated, subjectController.deleteSubject);

module.exports = router;
