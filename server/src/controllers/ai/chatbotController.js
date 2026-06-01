import { sendChatMessage, getUserChatHistory, deleteChatInteraction, deleteAllUserChats } from '../../services/ai/chatbotService.js';
import logger from '../../utils/logger.js';

export const chat = async (req, res) => {
  logger.info('Chat endpoint called', { body: req.body, user: req.user?.id || 'guest' });

  try {
    const { message } = req.body;
    const userId = req.user?.id || null;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await sendChatMessage(message, userId);

    logger.info('Chat result success:', { success: result.success });

    return res.status(200).json({
      success: result.success,
      reply: result.reply,
      suggestions: result.suggestions || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Chat Controller Error: %O', error);
    return res.status(500).json({
      success: false,
      reply: 'Sorry, I encountered an error. Please try again.',
      suggestions: [],
    });
  }
};

export const getHistory = async (req, res) => {
  logger.info('History endpoint called', { user: req.user?.id });

  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.warn('No userId found in token for history request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: [],
      });
    }

    const history = await getUserChatHistory(userId);
    logger.info(`Returning ${history.length} history items for user`, { userId });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Get History Error: %O', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      data: [],
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const deleted = await deleteChatInteraction(userId, id);

    if (deleted) {
      return res.status(200).json({ success: true, message: 'Conversation deleted' });
    } else {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
  } catch (error) {
    logger.error('Delete conversation error: %O', error);
    return res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};

export const deleteAllConversations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const count = await deleteAllUserChats(userId);

    return res.status(200).json({
      success: true,
      message: `Deleted ${count} conversations`
    });
  } catch (error) {
    logger.error('Delete all conversations error: %O', error);
    return res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};