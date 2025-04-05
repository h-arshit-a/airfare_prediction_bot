import { supabase, saveMessageToHistory, getUserChatHistory } from '../lib/supabase';
import { Message } from '@/components/ChatMessage';

/**
 * Saves a message to the user's chat history
 */
export const saveMessage = async (userId: string, message: Message) => {
  if (!userId) return null;
  
  try {
    return await saveMessageToHistory(
      userId,
      message.content,
      message.type
    );
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};

/**
 * Loads the user's chat history
 */
export const loadChatHistory = async (userId: string) => {
  if (!userId) return [];
  
  try {
    const history = await getUserChatHistory(userId);
    
    // Convert the DB format to the app's Message format
    return history.map(item => ({
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

/**
 * Clears the user's chat history
 */
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
    
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}; 