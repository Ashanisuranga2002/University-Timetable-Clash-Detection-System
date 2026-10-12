const { Router } = require('express');
const { getValidationRuns, runValidation } = require('../controllers/validationController.js');
const { authenticate, requireCoordinator } = require('../middleware/authMiddleware.js');
const router = Router();
router.use(authenticate, requireCoordinator);
router.get('/runs', getValidationRuns);
router.post('/run/:timetableId', runValidation);
module.exports = router;
