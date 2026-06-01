import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import {
  chat,
  getHistory,
  deleteConversation,
  deleteAllConversations
} from '../../controllers/ai/chatbotController.js';

const router = Router();


router.post('/chat', chat);


router.get('/chat/history', protect, getHistory);
router.delete('/chat/:id', protect, deleteConversation);
router.delete('/chat/history/all', protect, deleteAllConversations);

export default router;