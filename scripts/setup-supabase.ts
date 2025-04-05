import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://ofkzlmlymigrzkrshjgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma3psbWx5bWlncnprcnNoamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NTQ0NDYsImV4cCI6MjA1OTQzMDQ0Nn0.MFDarI_SdMLAsGuhQNrGnLJnDydEevQwGqzKZ2cAoLM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  try {
    // Create an API endpoint to create the chat_history table
    const { error } = await supabase.from('chat_history').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Placeholder user ID
      message_content: 'Test message',
      message_type: 'bot'
    });

    if (error) {
      if (error.code === '42P01') { // Relation doesn't exist error
        console.log('Table does not exist. Please create it in the Supabase dashboard.');
        console.log('Table definition:');
        console.log(`
          CREATE TABLE chat_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            message_content TEXT NOT NULL,
            message_type VARCHAR(4) NOT NULL CHECK (message_type IN ('user', 'bot')),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create policy to only allow users to access their own messages
          CREATE POLICY chat_history_policy ON chat_history
            FOR ALL
            USING (auth.uid() = user_id);

          -- Enable RLS
          ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
        `);
      } else {
        console.error('Error testing table:', error);
      }
    } else {
      console.log('Table exists!');
      
      // Delete the test row
      const { error: deleteError } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
        
      if (deleteError) {
        console.error('Error deleting test row:', deleteError);
      }
    }

    console.log('Database check complete!');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

setupDatabase(); 