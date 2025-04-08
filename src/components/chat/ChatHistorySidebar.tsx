import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistance } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/components/ChatMessage';
import { 
  getUserConversationList,
  loadConversation,
  deleteUserConversation, 
  clearChatHistory,
  startNewConversation
} from '@/services/chatHistoryService';
import { ChevronRight, Plus, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (messages: Message[]) => void;
  onNewConversation: () => void;
  onToggle: () => void;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

export const ChatHistorySidebar: React.FC<ChatHistoryProps> = ({ 
  isOpen, 
  onClose,
  onSelectConversation,
  onNewConversation,
  onToggle
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat history when sidebar opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
  }, [isOpen, user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const conversationList = await getUserConversationList(user.id);
      setConversations(conversationList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError("Failed to load conversation history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  const handleRefresh = () => {
    fetchConversations();
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const messages = await loadConversation(user.id, conversationId);
      if (messages.length > 0) {
        onSelectConversation(messages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering onSelectConversation
    
    if (!user) return;
    
    try {
      const success = await deleteUserConversation(user.id, conversationId);
      
      if (success) {
        // Remove from local state
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.id !== conversationId)
        );
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };
  
  const handleNewConversation = () => {
    startNewConversation();
    onNewConversation();
    onClose();
  };

  const handleClearAll = async () => {
    if (!user || !window.confirm('Are you sure you want to delete all conversations?')) return;
    
    try {
      const success = await clearChatHistory(user.id);
      
      if (success) {
        setConversations([]);
        onNewConversation();
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    
      {/* Sidebar Toggle Button */}
      <motion.button
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-30 bg-primary hover:bg-primary/90 text-white p-3 rounded-r-xl shadow-lg transition-all duration-300 ${
          isOpen ? 'left-[17.5rem]' : 'left-0'
        }`}
      >
        <ChevronRight 
          className={`h-5 w-5 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <motion.div 
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800/95 backdrop-blur-md shadow-xl z-30"
      >
        <div className="bg-primary/90 backdrop-blur-md text-white p-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Chat History</h2>
          </div>
        </div>

        <motion.div 
          className="p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button 
            onClick={handleNewConversation}
            className="w-full py-3 px-4 bg-primary/90 hover:bg-primary text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>New Conversation</span>
          </button>
        </motion.div>

        <div className="overflow-y-auto h-[calc(100%-8rem)] px-3">
          {isLoading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 text-center"
            >
              <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
              <button 
                onClick={handleRefresh}
                className="text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </motion.div>
          ) : conversations.length > 0 ? (
            <motion.ul 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {conversations.map((conversation, index) => (
                <motion.li 
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-300"
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium truncate w-48 text-gray-900 dark:text-gray-100">
                        {conversation.title}
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-opacity duration-200"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(conversation.timestamp)}
                    </p>
                  </motion.div>
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-40 text-center px-4"
            >
              <MessageSquare className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No chat history found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Your conversations will appear here once you start chatting.
              </p>
            </motion.div>
          )}
        </div>

        {conversations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700"
          >
            <button 
              onClick={handleClearAll}
              className="w-full py-2 px-4 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Conversations
            </button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}; 