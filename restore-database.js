#!/usr/bin/env node

/**
 * Script to restore database schema and data to new Supabase project
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Your new Supabase project details
const supabaseUrl = 'https://nxlacotiwogkaxwsftlw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFjb3Rpd29na2F4d3NmdGx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyOTQyOSwiZXhwIjoyMDczMTA1NDI5fQ.OqXBmzM6caUGC3-2didkQM0KUbQApOlq_WA7P2vyM40';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🔄 Creating database tables...');
  
  try {
    // Read the create_tables.sql file
    const createTablesSQL = fs.readFileSync('create_tables.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.error('❌ Error creating tables:', error);
      return false;
    }
    
    console.log('✅ Tables created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error reading SQL file:', error);
    return false;
  }
}

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('chat_history').select('count').limit(1);
    
    if (error) {
      console.log('ℹ️  Table not found yet (expected if not created)');
      return true;
    }
    
    console.log('✅ Connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database restoration...\n');
  
  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Cannot connect to Supabase. Please check your project details.');
    return;
  }
  
  // Create tables
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.log('❌ Failed to create tables. You may need to run the SQL manually in Supabase dashboard.');
    console.log('\n📋 Manual steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy the contents of create_tables.sql');
    console.log('5. Run the SQL');
    return;
  }
  
  console.log('\n✅ Database setup complete!');
  console.log('\n🎉 Your Flight Friend app should now work!');
  console.log('🌐 Visit: http://localhost:3001/');
}

main().catch(console.error);
