# Supabase Setup for FlightFriend Bot

This directory contains SQL migrations to set up the required tables and security policies for the FlightFriend bot's authentication and chat history features.

## Database Schema

### Profiles Table

Stores user profile information:

- `id`: UUID (references auth.users)
- `email`: TEXT (user's email address)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Chat Messages Table

Stores chat messages for each user:

- `id`: UUID (message identifier)
- `user_id`: UUID (references auth.users)
- `content`: TEXT (message content)
- `type`: TEXT ('user' or 'bot')
- `created_at`: TIMESTAMP

## Setup Instructions

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Copy your project URL and anon key from the API settings
3. Add these credentials to your environment variables or .env file:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run the migrations in the `migrations` directory using the Supabase CLI or manually via the SQL editor in the Supabase Dashboard

## Security

The database uses Row Level Security (RLS) policies to ensure:

1. Users can only access their own chat messages
2. Users can only update their own profile information
3. Public profiles are viewable by authenticated users

## Development

To make changes to the database schema:

1. Create a new migration file in the `migrations` directory
2. Write your SQL statements to modify the schema
3. Apply the migration using the Supabase CLI or manually via the SQL editor 