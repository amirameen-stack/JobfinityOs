# Supabase Setup Guide

This guide explains how to set up your JobfinityOs database in Supabase using migrations.

## What's Included

- **SCHEMA.sql** - Complete SQL schema with all tables, indexes, and Row-Level Security (RLS) policies
- **Tables Created:**
  - `leads` - Lead/prospect information
  - `lead_folders` - Folder organization for leads
  - `calls` - Call records and transcripts
  - `lead_files` - File attachments for leads

## Quick Setup (2 methods)

### Method 1: Using Supabase SQL Editor (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Copy the entire contents of `SCHEMA.sql`
5. Paste it into the SQL editor
6. Click **Run**
7. Done! ✅ All tables, indexes, and security policies are created

### Method 2: Using Supabase CLI (Recommended for Teams)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project
supabase link --project-id YOUR_PROJECT_ID

# Create a new migration (optional naming)
supabase migration new create_initial_schema

# Or manually push the SCHEMA.sql file
supabase db push --file SCHEMA.sql
```

## What Gets Created

### Tables
- **leads** - Company and contact information with status tracking
- **lead_folders** - User-created folders for organizing leads
- **calls** - Twilio call records with transcripts and metadata
- **lead_files** - File storage records linked to leads

### Security
- **Row-Level Security (RLS)** - Users can only access their own data
- **Foreign Keys** - Referential integrity enforced
- **Indexes** - Performance optimizations on frequently queried columns

### Features
- UUID primary keys for distributed systems
- Timestamps (created_at, updated_at) on all tables
- JSONB support for call transcripts
- Cascade deletes for data cleanup
- Status enums for data validation

## Testing After Setup

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Troubleshooting

**Error: "relation already exists"**
- Tables already exist; this is fine (idempotent)

**Error: "referenced relation does not exist"**
- Run all SQL at once; don't run individual CREATE TABLE statements separately

**Error: "permission denied"**
- Ensure your Supabase project allows the current user to create tables
- Check your authentication token is valid

## Next Steps

1. Your backend can now connect to these tables
2. Verify your `.env` has the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Test by running a simple query from your app

For more info, see [Supabase Docs](https://supabase.com/docs)
