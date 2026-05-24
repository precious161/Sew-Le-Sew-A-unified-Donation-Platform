import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Bot, User, Sparkles,
  History, Clock, ChevronRight, Calendar, Trash2,
  MessageSquare, ArrowLeft, AlertTriangle, Trash
} from 'lucide-react';
import ChatbotService from '../../services/ChatbotService';
import { useAuth } from '../../hooks/useAuth';

const ChatBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `👋 Hello${user?.FirstName ? ' ' + user.FirstName : ''}! I'm Sew Le Sew Assistant. I can help you with:\n\n🩸 Blood donation requirements & eligibility\n❤️ Organ donation registration\n💰 Financial contributions\n📦 In-kind medical supplies\n📍 Upcoming donation events\n📊 Current blood shortage alerts\n\nWhat would you like to know?`
    }
  ]);
  const [suggestions, setSuggestions] = useState([
    { text: "Am I eligible to donate blood?", action: null, description: "Check requirements" },
    { text: "What blood type is most needed?", action: null, description: "Current shortage" },
    { text: "Where are donation events?", action: "/events", description: "Find locations" },
    { text: "How to register as an organ donor?", action: null, description: "Learn process" },
  ]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type }
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, activeTab]);

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0 && user) {
      loadChatHistory();
    }
  }, [activeTab]);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await ChatbotService.getChatHistory();
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async (messageText = null) => {
  const userMessage = messageText || input.trim();
  if (!userMessage || isLoading) return;

  // Add user message to UI immediately
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  if (!messageText) setInput('');
  setIsLoading(true);

  try {

    const response = await ChatbotService.sendMessage(userMessage);

    console.log('Response from backend:', response); // Debug log

    setMessages(prev => [...prev, {
      role: 'bot',
      content: response.reply || 'I received your message but having trouble responding.'
    }]);

    if (response.suggestions && response.suggestions.length > 0) {
      setSuggestions(response.suggestions);
    }

    // Refresh history after sending message
    if (user) {
      loadChatHistory();
    }
  } catch (error) {
    console.error('Send message error:', error);
    setMessages(prev => [...prev, {
      role: 'bot',
      content: 'Sorry, I encountered an error. Please try again later.'
    }]);
  } finally {
    setIsLoading(false);
  }
};

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.action) {
      window.location.href = suggestion.action;
    } else {
      sendMessage(suggestion.text);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // DELETE SINGLE CONVERSATION
  const handleDeleteConversation = async (chatId) => {
    try {
      const response = await ChatbotService.deleteChat(chatId);
      if (response.success) {
        setHistory(prev => prev.filter(chat => chat.id !== chatId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // DELETE ALL HISTORY
  const handleDeleteAllHistory = async () => {
    try {
      const response = await ChatbotService.deleteAllChats();
      if (response.success) {
        setHistory([]);
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete all conversations:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const groupByDate = (chats) => {
    const groups = {};
    chats.forEach(chat => {
      const date = new Date(chat.interactionDate).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(chat);
    });
    return groups;
  };

  const groupedHistory = groupByDate(history);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] p-4 bg-medical-red text-white rounded-full shadow-2xl hover:bg-red-700 transition-all group"
      >
        <MessageCircle size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
     <div className={`fixed bottom-6 right-6 z-[100] bg-white dark:bg-[#111C44] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-white/10 transition-all duration-300 ${
      isMinimized
        ? 'w-80 h-14'
        : 'w-96 h-[600px] max-h-[80vh] max-w-[calc(100vw-3rem)]'
    }`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-medical-red to-red-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bot size={20} />
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">Sew Le Sew Assistant</h3>
              <p className="text-[9px] opacity-80">AI-Powered • Knows your data • 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/20 rounded-xl p-0.5 mr-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                  activeTab === 'chat' ? 'bg-white text-medical-red' : 'text-white hover:bg-white/20'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                  activeTab === 'history' ? 'bg-white text-medical-red' : 'text-white hover:bg-white/20'
                }`}
              >
                History {history.length > 0 && `(${history.length})`}
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="hover:bg-white/20 rounded-lg p-1 transition-all"
            >
              {isMinimized ? <Bot size={14} /> : <span className="text-sm">_</span>}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setActiveTab('chat');
              }}
              className="hover:bg-white/20 rounded-lg p-1 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-[#0b1121]/50">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-medical-red text-white rounded-br-none'
                          : 'bg-white dark:bg-[#1e293b] text-gray-800 dark:text-white rounded-bl-none shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {msg.role === 'bot' ? (
                          <Bot size={12} className="text-medical-red" />
                        ) : (
                          <User size={12} className="opacity-70" />
                        )}
                        <span className="text-[8px] font-black uppercase opacity-70">
                          {msg.role === 'bot' ? 'Assistant' : user?.FirstName || 'You'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-[#1e293b] p-3 rounded-2xl rounded-bl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {suggestions.length > 0 && (
                <div className="p-3 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#0b1121]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={12} className="text-medical-red" />
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Suggested Actions</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="group px-3 py-2 bg-white dark:bg-[#1e293b] rounded-xl text-left hover:bg-medical-red hover:text-white transition-all shadow-sm border border-gray-100 dark:border-white/5"
                      >
                        <p className="text-[10px] font-black">{s.text}</p>
                        {s.description && (
                          <p className="text-[8px] text-gray-400 group-hover:text-white/70">{s.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#111C44]">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about donations..."
                    className="flex-1 p-3 rounded-2xl bg-gray-100 dark:bg-[#0b1121] border-none outline-none text-sm dark:text-white placeholder:text-gray-400"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="p-3 bg-medical-red text-white rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[8px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                  <Bot size={10} /> AI knows your data • Real-time stats
                </p>
              </div>
            </>
          )}

          {/* HISTORY TAB WITH DELETE FEATURES */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0b1121]/50">
              {loadingHistory ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-medical-red"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={24} className="text-gray-400" />
                  </div>
                  <h4 className="font-black text-[#111C44] dark:text-white mb-2">No conversations yet</h4>
                  <p className="text-[10px] text-gray-400">
                    Start chatting with the assistant and your history will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Delete All Button */}
                  <div className="sticky top-0 z-10 p-3 bg-gray-50 dark:bg-[#0b1121]/90 backdrop-blur-sm border-b border-gray-200 dark:border-white/10">
                    <button
                      onClick={() => setDeleteConfirm({ type: 'all' })}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-wider"
                    >
                      <Trash2 size={14} />
                      Delete All Conversations ({history.length})
                    </button>
                  </div>

                  <div className="p-4 space-y-6">
                    {Object.entries(groupedHistory).map(([date, chats]) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={12} className="text-gray-400" />
                          <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                            {new Date(date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {chats.map((chat) => (
                            <div
                              key={chat.id}
                              className="group relative p-3 rounded-xl bg-white dark:bg-[#1e293b] hover:bg-medical-red/5 transition-all border border-gray-100 dark:border-white/5"
                            >
                              <div className="flex justify-between items-start">
                                <div
                                  className="flex-1 cursor-pointer"
                                  onClick={() => {
                                    setActiveTab('chat');
                                    setMessages([
                                      { role: 'bot', content: chat.response },
                                      { role: 'user', content: chat.query }
                                    ].reverse());
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <User size={10} className="text-gray-400" />
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 line-clamp-1">
                                      {chat.query.length > 60 ? chat.query.substring(0, 60) + '...' : chat.query}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Bot size={10} className="text-medical-red" />
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                      {chat.response.length > 80 ? chat.response.substring(0, 80) + '...' : chat.response}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                  <span className="text-[8px] text-gray-400">
                                    {formatDate(chat.interactionDate)}
                                  </span>
                                  {/* Delete Individual Button */}
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'single', id: chat.id })}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 max-w-xs w-full text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h4 className="font-black text-[#111C44] dark:text-white mb-2">
              {deleteConfirm.type === 'all' ? 'Delete All Conversations?' : 'Delete This Conversation?'}
            </h4>
            <p className="text-xs text-gray-500 mb-6">
              {deleteConfirm.type === 'all'
                ? 'This will permanently delete your entire chat history. This action cannot be undone.'
                : 'This conversation will be permanently deleted. You cannot undo this action.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 font-black text-[10px] uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'all') {
                    handleDeleteAllHistory();
                  } else {
                    handleDeleteConversation(deleteConfirm.id);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-wider hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;