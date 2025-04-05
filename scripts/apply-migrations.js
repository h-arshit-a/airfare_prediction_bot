/**
 * Script to apply database migrations to Supabase
 * 
 * Usage:
 * node scripts/apply-migrations.js
 * 
 * Make sure to set the following environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    // Get all SQL files in the migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to apply migrations in order
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Apply each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Applying migration: ${file}`);
      
      const { error } = await supabase.rpc('pgaudit.exec_sql', { sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Successfully applied migration: ${file}`);
    }
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
applyMigrations(); 