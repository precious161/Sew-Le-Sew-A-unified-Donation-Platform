import { Router } from 'express';
import chatbotRoutes from './chatbotRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = Router();

// Mount sub-routes
router.use('/', chatbotRoutes);
router.use('/analytics', analyticsRoutes);

export default router;