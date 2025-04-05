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

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (messages: Message[]) => void;
  onNewConversation: () => void;
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
  onNewConversation
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
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        ></div>
      )}
    
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } z-30`}
      >
        <div className="bg-blue-600 text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              <h2 className="text-lg font-medium">Chat History</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-white hover:text-gray-200"
                title="Refresh history"
              >
                <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
              <button 
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-2">
            Access your previous conversations
          </p>
        </div>

        <div className="p-2">
          <button 
            onClick={handleNewConversation}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center gap-2 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>New Conversation</span>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-8rem)]">
          {isLoading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
              <button 
                onClick={handleRefresh}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Try again
              </button>
            </div>
          ) : conversations.length > 0 ? (
            <ul className="divide-y dark:divide-gray-700">
              {conversations.map(conversation => (
                <li 
                  key={conversation.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="p-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium truncate w-48">
                        {conversation.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(conversation.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No chat history found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Your conversations will appear here once you start chatting.
              </p>
            </div>
          )}
        </div>

        {conversations.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-2">
            <button 
              onClick={handleClearAll}
              className="w-full py-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Clear All Conversations
            </button>
          </div>
        )}
      </div>
    </>
  );
}; 