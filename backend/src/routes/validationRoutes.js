import { Router } from 'express';
import { getValidationRuns, runValidation } from '../controllers/validationController.js';
import { authenticate, requireCoordinator } from '../middleware/authMiddleware.js';
const router = Router();
router.use(authenticate, requireCoordinator);
router.get('/runs', getValidationRuns);
router.post('/run/:timetableId', runValidation);
export default router;
