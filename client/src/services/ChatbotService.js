import api from '../api/axios';

const ChatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await api.post('/ai/chat', { message });
      return response.data;
    } catch (error) {
      console.error('Chatbot API Error:', error.response?.data || error.message);
      return {
        success: false,
        reply: "Sorry, I'm having trouble connecting to the Red Cross servers. Please try again later.",
        suggestions: [],
      };
    }
  },

  getChatHistory: async () => {
    try {
      const response = await api.get('/ai/chat/history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat history:', error.response?.data || error.message);
      return { success: false, data: [] };
    }
  },

  deleteChat: async (chatId) => {
    try {
      const response = await api.delete(`/ai/chat/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return { success: false };
    }
  },

  deleteAllChats: async () => {
    try {
      const response = await api.delete('/ai/chat/history/all');
      return response.data;
    } catch (error) {
      console.error('Failed to delete all chats:', error);
      return { success: false };
    }
  },
};

export default ChatbotService;