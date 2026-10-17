const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');

// Subgroups & Preview
router.get('/subgroups/:courseCode', coordinatorController.getSubgroups);
router.post('/preview-timetable', coordinatorController.previewTimetable);

// Coordinator Management APIs
router.get('/stats', coordinatorController.getCoordinatorStats);
router.get('/courses', coordinatorController.getAllCoursesWithTimetable);
router.get('/courses/:courseCode', coordinatorController.getCourseDetails);
router.post('/courses/:courseCode/schedule', coordinatorController.addScheduleSlot);
router.delete('/courses/:courseCode/schedule/:slotIndex', coordinatorController.deleteScheduleSlot);
router.post('/courses/:courseCode/subgroups', coordinatorController.createSubgroup);
router.delete('/subgroups/:subgroupId', coordinatorController.deleteSubgroup);
router.get('/clash-requests', coordinatorController.getClashRequests);
router.put('/clash-requests/:id/resolve', coordinatorController.resolveClashRequest);

module.exports = router;
