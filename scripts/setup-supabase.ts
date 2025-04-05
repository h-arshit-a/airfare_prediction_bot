import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://ofkzlmlymigrzkrshjgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma3psbWx5bWlncnprcnNoamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NTQ0NDYsImV4cCI6MjA1OTQzMDQ0Nn0.MFDarI_SdMLAsGuhQNrGnLJnDydEevQwGqzKZ2cAoLM';

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
    // Check if the table exists
    const { error: checkError } = await supabase.from('chat_history').select('count(*)', { count: 'exact' }).limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Table does not exist. Please use the SQL console in Supabase to create it:');
      console.log(CREATE_TABLE_SQL);
    } else if (checkError) {
      console.error('Error checking table:', checkError);
    } else {
      console.log('Table exists!');
      
      // Check if conversation_id column exists
      const { data, error: describeError } = await supabase.rpc('get_table_columns', { table_name: 'chat_history' });
      
      if (describeError) {
        console.error('Error checking columns:', describeError);
      } else {
        const hasConversationId = data.some((col: any) => col.column_name === 'conversation_id');
        
        if (!hasConversationId) {
          console.log('conversation_id column does not exist. Please run:');
          console.log(`
            ALTER TABLE chat_history ADD COLUMN conversation_id UUID NOT NULL DEFAULT uuid_generate_v4();
            CREATE INDEX idx_chat_history_conversation ON chat_history(conversation_id);
          `);
        } else {
          console.log('conversation_id column exists. Table structure is correct!');
        }
      }
    }
    
    console.log('Database check complete!');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

setupDatabase(); 