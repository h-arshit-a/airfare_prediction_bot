import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://ofkzlmlymigrzkrshjgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma3psbWx5bWlncnprcnNoamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NTQ0NDYsImV4cCI6MjA1OTQzMDQ0Nn0.MFDarI_SdMLAsGuhQNrGnLJnDydEevQwGqzKZ2cAoLM';

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
  message_content: string;
  message_type: 'user' | 'bot';
  created_at: string;
};

// Function to save message to history
export const saveMessageToHistory = async (
  userId: string,
  content: string,
  type: 'user' | 'bot'
) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('chat_history')
    .insert({
      user_id: userId,
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