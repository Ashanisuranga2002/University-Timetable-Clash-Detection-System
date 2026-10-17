const express = require('express');
const controller = require('../controllers/courseDeletionController');

const router = express.Router();

router.post('/', controller.createDeletionRequest);
router.get('/student/:studentId', controller.getStudentDeletionRequests);

module.exports = router;
