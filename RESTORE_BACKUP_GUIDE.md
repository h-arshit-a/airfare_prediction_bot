# Supabase Backup Restoration Guide

## Step 1: Create New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `flightfriend-bot`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait for project to be ready (2-3 minutes)

## Step 2: Get Project Details

1. In your new project dashboard, go to **Settings > API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (optional)

## Step 3: Update Configuration

1. Open `update-supabase-config.js`
2. Replace the placeholder values in `NEW_CONFIG` with your actual project details
3. Run: `node update-supabase-config.js`

## Step 4: Restore Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of your backup file: `db_cluster-02-05-2025@12-17-48.backup (1)`
4. Click "Run" to execute the SQL
5. Wait for completion (may take a few minutes)

## Step 5: Test Your Application

1. Your dev server should already be running at `http://localhost:3001/`
2. Test authentication features
3. Test chat functionality
4. Verify flight search works

## Troubleshooting

- If you get permission errors, make sure you're using the service_role key for admin operations
- If tables don't exist, check the SQL execution logs for errors
- If authentication fails, verify the anon key is correct

## Alternative: Manual Table Creation

If the backup doesn't work, you can manually create the tables using the schema in `supabase/schema.sql`:

1. Go to SQL Editor in Supabase
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL to create tables and policies
