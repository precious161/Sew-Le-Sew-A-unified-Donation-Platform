import { sendChatMessage, getUserChatHistory, deleteChatInteraction, deleteAllUserChats } from '../../services/ai/chatbotService.js';

export const chat = async (req, res) => {
  console.log(' Chat endpoint called');
  console.log('Request body:', req.body);
  console.log('User from token:', req.user);

  try {
    const { message } = req.body;
    // IMPORTANT: Use the authenticated user's ID, NOT 'guest'
    const userId = req.user?.id || null;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await sendChatMessage(message, userId);

    console.log('Chat result success:', result.success);

    return res.status(200).json({
      success: result.success,
      reply: result.reply,
      suggestions: result.suggestions || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat Controller Error:', error);
    return res.status(500).json({
      success: false,
      reply: 'Sorry, I encountered an error. Please try again.',
      suggestions: [],
    });
  }
};

export const getHistory = async (req, res) => {
  console.log('📜 History endpoint called');
  console.log('User from token:', req.user);

  try {
    const userId = req.user?.id;

    if (!userId) {
      console.log('❌ No userId found in token');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: [],
      });
    }

    const history = await getUserChatHistory(userId);
    console.log(`📜 Returning ${history.length} history items`);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get History Error:', error);
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
    console.error('Delete error:', error);
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

    return res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};