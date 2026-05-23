import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { authorize } from '../../middleware/users/roleMiddleware.js';
import {
  getStats,
  getPublicStats,
  getPredictions,
  exportAnalytics,
  exportPDFReport
} from '../../controllers/ai/analyticsController.js';

const router = Router();

// PUBLIC ROUTE FOR THE LANDING PAGE (no auth required)
router.get('/public-stats', getPublicStats);

// ADMIN ROUTES
router.get('/stats', protect, authorize('Red_Cross_Admin'), getStats);
router.get('/predictions', protect, authorize('Red_Cross_Admin'), getPredictions);
router.get('/export/csv', protect, authorize('Red_Cross_Admin'), exportAnalytics);
router.get('/export/pdf', protect, authorize('Red_Cross_Admin'), exportPDFReport);

export default router;