import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://nxlacotiwogkaxwsftlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFjb3Rpd29na2F4d3NmdGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjk0MjksImV4cCI6MjA3MzEwNTQyOX0.uTNczVbQTt62ZlsYk0ybMtmFadeIBgyKeQ7ACmxtnx0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

// Helper function to get user ID
export const getUserId = async () => {
  const session = await getCurrentSession();
  return session?.user?.id || null;
};

// Types for chat message history
export type ChatMessageHistory = {
  id: string;
  user_id: string;
  conversation_id: string;
  message_content: string;
  message_type: 'user' | 'bot';
  created_at: string;
};

// Function to save message to history
export const saveMessageToHistory = async (
  userId: string,
  content: string,
  type: 'user' | 'bot',
  conversationId: string
) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('chat_history')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      message_content: content,
      message_type: type
    })
    .select();
    
  if (error) {
    console.error('Error saving message to history:', error);
    return null;
  }
  
  return data;
};

// Function to get user's chat history
export const getUserChatHistory = async (userId: string) => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
  
  return data as ChatMessageHistory[];
};

// Get user's conversations (grouped by conversation_id)
export const getUserConversations = async (userId: string) => {
  if (!userId) return [];
  
  // Get unique conversation IDs with their latest message date
  const { data, error } = await supabase
    .from('chat_history')
    .select('conversation_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
  
  // Get unique conversation IDs
  const conversationMap = new Map();
  data.forEach(item => {
    if (!conversationMap.has(item.conversation_id)) {
      conversationMap.set(item.conversation_id, item.created_at);
    }
  });
  
  // Get first message of each conversation to use as title
  const conversations = [];
  
  for (const [conversationId, timestamp] of conversationMap.entries()) {
    const { data: firstMessage, error: firstMessageError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
      
    if (!firstMessageError) {
      conversations.push({
        id: conversationId,
        title: firstMessage.message_content.substring(0, 40) + (firstMessage.message_content.length > 40 ? '...' : ''),
        timestamp,
        preview: firstMessage.message_content
      });
    }
  }
  
  return conversations;
};

// Get messages for a specific conversation
export const getConversationMessages = async (userId: string, conversationId: string) => {
  if (!userId || !conversationId) return [];
  
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
  
  return data as ChatMessageHistory[];
};

// Delete a specific conversation
export const deleteConversation = async (userId: string, conversationId: string) => {
  if (!userId || !conversationId) return false;
  
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId)
    .eq('conversation_id', conversationId);
    
  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
  
  return true;
};

// Types for database tables
export type UserProfile = {
  id: string;
  email: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  type: 'user' | 'bot';
  created_at: string;
};

// Define message types for our app
export interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
}

// Auth utilities
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Chat history utilities
export const saveChatHistory = async (userId: string, messages: any[]) => {
  const { data, error } = await supabase
    .from('chat_history')
    .upsert({ 
      user_id: userId,
      conversation_id: new Date().toISOString(), // Use a timestamp as conversation ID
      messages: messages,
      updated_at: new Date()
    });
  
  if (error) console.error('Error saving chat history:', error);
  return data;
};

export const getChatHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) console.error('Error fetching chat history:', error);
  return data || [];
}; 