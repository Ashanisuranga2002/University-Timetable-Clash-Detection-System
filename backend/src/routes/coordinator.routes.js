const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');

router.get('/subgroups/:courseCode', coordinatorController.getSubgroups);
router.post('/preview-timetable', coordinatorController.previewTimetable);

module.exports = router;
