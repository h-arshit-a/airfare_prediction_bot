-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the chat_history table with the structure your code expects
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
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

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
