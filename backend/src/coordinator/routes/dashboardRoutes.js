const { Router } = require('express');
const { getDashboardStats, getRecentUploads } = require('../controllers/dashboardController.js');
const { authenticate, requireCoordinator } = require('../middleware/authMiddleware.js');
const router = Router();
router.use(authenticate, requireCoordinator);
router.get('/stats', getDashboardStats);
router.get('/recent-uploads', getRecentUploads);
module.exports = router;
