import { Router } from 'express';
import { protect, optionalAuth } from '../../middleware/authMiddleware.js';
import {
  chat,
  getHistory,
  deleteConversation,
  deleteAllConversations
} from '../../controllers/ai/chatbotController.js';

const router = Router();

//  'optionalAuth' so anyone on the landing page can chat!
router.post('/chat', optionalAuth, chat);

// Protected routes - require login
router.get('/chat/history', protect, getHistory);
router.delete('/chat/:id', protect, deleteConversation);
router.delete('/chat/history/all', protect, deleteAllConversations);

export default router;