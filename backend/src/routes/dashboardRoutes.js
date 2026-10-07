import { Router } from 'express';
import { getDashboardStats, getRecentUploads } from '../controllers/dashboardController.js';
import { authenticate, requireCoordinator } from '../middleware/authMiddleware.js';
const router = Router();
router.use(authenticate, requireCoordinator);
router.get('/stats', getDashboardStats);
router.get('/recent-uploads', getRecentUploads);
export default router;
