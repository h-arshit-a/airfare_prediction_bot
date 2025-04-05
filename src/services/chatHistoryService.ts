import { 
  supabase, 
  saveMessageToHistory, 
  getUserChatHistory, 
  getUserConversations,
  getConversationMessages,
  deleteConversation
} from '../lib/supabase';
import { Message } from '@/components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

// Get or create a conversation ID
export const getOrCreateConversationId = (): string => {
  // Check if we have a current conversation ID in session storage
  let conversationId = sessionStorage.getItem('current_conversation_id');
  
  // If not, create a new one
  if (!conversationId) {
    conversationId = uuidv4();
    sessionStorage.setItem('current_conversation_id', conversationId);
  }
  
  return conversationId;
};

// Start a new conversation
export const startNewConversation = (): string => {
  const conversationId = uuidv4();
  sessionStorage.setItem('current_conversation_id', conversationId);
  return conversationId;
};

// Save a message to the current conversation
export const saveMessage = async (userId: string, message: Message) => {
  if (!userId) return null;
  
  // Get current conversation ID
  const conversationId = getOrCreateConversationId();
  
  try {
    return await saveMessageToHistory(
      userId,
      message.content,
      message.type,
      conversationId
    );
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};

// Get all conversations for a user
export const getUserConversationList = async (userId: string) => {
  if (!userId) return [];
  
  try {
    return await getUserConversations(userId);
  } catch (error) {
    console.error('Error getting conversation list:', error);
    return [];
  }
};

// Load messages for a specific conversation
export const loadConversation = async (userId: string, conversationId: string) => {
  if (!userId || !conversationId) return [];
  
  try {
    // Set this as the current conversation
    sessionStorage.setItem('current_conversation_id', conversationId);
    
    const history = await getConversationMessages(userId, conversationId);
    
    // Convert the DB format to the app's Message format
    return history.map(item => ({
      id: item.id,
      content: item.message_content,
      type: item.message_type,
      timestamp: new Date(item.created_at),
    }));
  } catch (error) {
    console.error('Error loading conversation:', error);
    return [];
  }
};

// Load the user's most recent chat messages
export const loadChatHistory = async (userId: string) => {
  if (!userId) return [];
  
  try {
    // Get current conversation ID
    const conversationId = getOrCreateConversationId();
    
    // Try to get messages for this conversation
    const messages = await getConversationMessages(userId, conversationId);
    
    // If no messages found for this conversation ID, get any messages for this user
    if (messages.length === 0) {
      const allHistory = await getUserChatHistory(userId);
      
      // If we have messages, use the most recent conversation ID
      if (allHistory.length > 0) {
        // Find the most recent conversation ID
        const recentConversationId = allHistory[allHistory.length - 1].conversation_id;
        sessionStorage.setItem('current_conversation_id', recentConversationId);
        
        // Get messages for this conversation
        const recentMessages = await getConversationMessages(userId, recentConversationId);
        
        return recentMessages.map(item => ({
          id: item.id,
          content: item.message_content,
          type: item.message_type,
          timestamp: new Date(item.created_at),
        }));
      }
    }
    
    // Convert the DB format to the app's Message format
    return messages.map(item => ({
      id: item.id,
      content: item.message_content,
      type: item.message_type,
      timestamp: new Date(item.created_at),
    }));
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

// Delete a specific conversation
export const deleteUserConversation = async (userId: string, conversationId: string) => {
  if (!userId) return false;
  
  try {
    const success = await deleteConversation(userId, conversationId);
    
    // If we deleted the current conversation, start a new one
    if (success && conversationId === sessionStorage.getItem('current_conversation_id')) {
      startNewConversation();
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

// Clear all user chat history
export const clearChatHistory = async (userId: string) => {
  if (!userId) return false;
  
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error clearing history:', error);
      return false;
    }
    
    // Start a new conversation
    startNewConversation();
    
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}; 