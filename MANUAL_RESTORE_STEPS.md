# Manual Database Restoration Steps

## Quick Setup (Recommended)

### Step 1: Create Tables in Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `nxlacotiwogkaxwsftlw`
3. Go to **SQL Editor**
4. Click **New query**
5. Copy and paste this SQL:

```sql
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
```

6. Click **Run** to execute the SQL

### Step 2: Test Your Application

1. Your app is running at: http://localhost:3001/
2. Try to sign up/login
3. Test the chat functionality
4. Test flight search

## Alternative: Full Backup Restoration

If you want to restore all your old data:

1. In Supabase SQL Editor, create a new query
2. Copy the ENTIRE contents of your backup file: `db_cluster-02-05-2025@12-17-48.backup (1)`
3. Paste it and run it
4. This will restore all your old data and structure

**Note**: The backup file is very large and may take several minutes to execute.
