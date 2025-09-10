import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://nxlacotiwogkaxwsftlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFjb3Rpd29na2F4d3NmdGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjk0MjksImV4cCI6MjA3MzEwNTQyOX0.uTNczVbQTt62ZlsYk0ybMtmFadeIBgyKeQ7ACmxtnx0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL for creating the chat_history table
const CREATE_TABLE_SQL = `
-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(4) NOT NULL CHECK (message_type IN ('user', 'bot')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on conversation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_conversation ON chat_history(conversation_id);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to only allow users to access their own messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_history' AND policyname = 'chat_history_policy'
  ) THEN
    CREATE POLICY chat_history_policy ON chat_history
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END
$$;
`;

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  try {
    // Check if the table exists - simple way by trying to insert a test record
    const { error } = await supabase.from('chat_history').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      conversation_id: '00000000-0000-0000-0000-000000000000',
      message_content: 'Test message',
      message_type: 'bot'
    }).select('id');
    
    if (error) {
      if (error.code === '42P01') { // Relation doesn't exist error
        console.log('Table does not exist. Please use the SQL console in Supabase to create it:');
        console.log(CREATE_TABLE_SQL);
      } else {
        console.error('Error checking table:', error);
      }
    } else {
      console.log('Table exists with the correct structure!');
      
      // Delete the test row
      await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }
    
    console.log('Database check complete!');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

setupDatabase(); 