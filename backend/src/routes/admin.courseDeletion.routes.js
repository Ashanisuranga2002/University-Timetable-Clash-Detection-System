const express = require('express');
const controller = require('../controllers/courseDeletionController');

const router = express.Router();

router.get('/', controller.getAdminDeletionRequests);
router.put('/:id/approve', controller.approveDeletionRequest);
router.put('/:id/reject', controller.rejectDeletionRequest);

module.exports = router;