# FlightFriend - AI Airfare Assistant

FlightFriend is an AI-powered chatbot that helps users find flight information, get travel tips, and search for flights. This app is built using React, TypeScript, and Vite with a focus on providing a smooth user experience.

## Features

- **AI Chatbot Interface**: Ask questions about flights, travel tips, and more
- **Flight Search**: Search for flights with specific parameters
- **Sort Flight Results**: Sort by price or duration
- **User Authentication**: Sign up and log in with email/password via Supabase
- **Chat History**: Saved chat history for logged-in users
- **Responsive Design**: Works on desktop and mobile devices

## Authentication Setup

This application uses Supabase for authentication and storing chat history. Here's how it's set up:

1. **Supabase Client**: Initialized in `src/lib/supabase.ts` with project URL and anonymous key
2. **Auth Context**: Manages authentication state in `src/lib/AuthContext.tsx`
3. **User Interface**:
   - Login/Signup modal through the ProfileButton component in the header
   - User profile menu with sign-out option when authenticated

## Database Schema

The Supabase database includes two main tables:

1. **profiles**: Stores user profile information
   - Automatically created when a user signs up
   - Contains email and timestamps

2. **chat_messages**: Stores individual chat messages for each user
   - Links to user profiles via user_id
   - Stores message content, type ('user' or 'bot')
   - Includes timestamps for sorting

## Supabase Setup

To set up the required database tables and security policies:

1. Create a Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Copy your project URL and anon key from the API settings
3. Add these credentials to `src/lib/supabase.ts`
4. Execute the SQL in `supabase/migrations/20230801000000_create_auth_tables.sql` via Supabase SQL Editor

See the `supabase/README.md` file for more detailed instructions.

## Local Development

To run this project locally:

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Technologies Used

- React & React Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase for authentication and database
- Vite for fast development and building

## Project info

**URL**: https://lovable.dev/projects/29c5809c-0093-4872-b4d2-f31122d982bf

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/29c5809c-0093-4872-b4d2-f31122d982bf) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/29c5809c-0093-4872-b4d2-f31122d982bf) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
