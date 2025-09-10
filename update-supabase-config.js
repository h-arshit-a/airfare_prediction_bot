#!/usr/bin/env node

/**
 * Script to update Supabase configuration with new project details
 * Run this after creating your new Supabase project
 */

const fs = require('fs');
const path = require('path');

// Configuration template - replace these with your actual values
const NEW_CONFIG = {
  projectUrl: 'YOUR_NEW_PROJECT_URL', // e.g., 'https://xxxxxxxxxxxxx.supabase.co'
  anonKey: 'YOUR_NEW_ANON_KEY',       // Your public anon key
  serviceRoleKey: 'YOUR_SERVICE_ROLE_KEY' // Your service role key (optional)
};

function updateFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply replacements
    Object.entries(replacements).forEach(([oldValue, newValue]) => {
      content = content.replace(new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newValue);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔄 Updating Supabase configuration...\n');
  
  // Check if config values are still placeholders
  if (NEW_CONFIG.projectUrl === 'YOUR_NEW_PROJECT_URL') {
    console.log('❌ Please update the NEW_CONFIG object in this script with your actual Supabase project details first!');
    console.log('\nTo get your project details:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your new project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy the Project URL and anon key');
    console.log('5. Update this script and run it again');
    return;
  }
  
  // Update src/lib/supabase.ts
  updateFile('src/lib/supabase.ts', {
    'https://ofkzlmlymigrzkrshjgd.supabase.co': NEW_CONFIG.projectUrl,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma3psbWx5bWlncnprcnNoamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NTQ0NDYsImV4cCI6MjA1OTQzMDQ0Nn0.MFDarI_SdMLAsGuhQNrGnLJnDydEevQwGqzKZ2cAoLM': NEW_CONFIG.anonKey
  });
  
  // Update scripts/setup-supabase.ts
  updateFile('scripts/setup-supabase.ts', {
    'https://ofkzlmlymigrzkrshjgd.supabase.co': NEW_CONFIG.projectUrl,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma3psbWx5bWlncnprcnNoamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NTQ0NDYsImV4cCI6MjA1OTQzMDQ0Nn0.MFDarI_SdMLAsGuhQNrGnLJnDydEevQwGqzKZ2cAoLM': NEW_CONFIG.anonKey
  });
  
  console.log('\n✅ Configuration updated successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/setup-supabase.ts');
  console.log('2. Import your backup file in the Supabase SQL editor');
  console.log('3. Test your application');
}

main();
