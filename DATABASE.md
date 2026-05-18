# Database Setup - JobfinityOs

This document explains the database schema and how to set it up properly.

## Files in This Directory

| File | Purpose |
|------|---------|
| **SCHEMA.sql** | Complete PostgreSQL schema with all tables, indexes, and RLS policies |
| **SETUP.md** | Step-by-step setup instructions for Supabase |
| **supabase.toml** | Supabase project configuration |
| **DATABASE.md** | Detailed schema documentation |

## Quick Start

**For your client/team:**

1. Read `SETUP.md` for step-by-step instructions
2. Copy the `SCHEMA.sql` file content
3. Paste into Supabase SQL Editor and run

**That's it!** No manual table creation needed.

## Database Architecture

### Entity Relationship Diagram

```
users (auth.users)
  ├── leads
  │   ├── lead_folders
  │   ├── calls
  │   └── lead_files
```

### Table Overview

| Table | Purpose | Owner |
|-------|---------|-------|
| `leads` | Lead/prospect data (company, contact info) | Per user (RLS) |
| `lead_folders` | Organize leads into folders | Per user (RLS) |
| `calls` | AI call records with Twilio integration | Per user (RLS) |
| `lead_files` | File attachments linked to leads | Per user (RLS) |

### Security

✅ **Row-Level Security (RLS)** enabled on all tables
- Users can only see/edit their own data
- No data leakage between users
- Policies defined at database level (secure)

## Why This Approach?

### ✅ Benefits
- **Version Controlled** - Schema changes tracked in git
- **Reproducible** - Same setup every time, anywhere
- **Scalable** - Works for 1 user or 1 million
- **Secure** - RLS policies protect user data
- **Maintainable** - SQL is the source of truth

### ❌ Avoid Manual Setup
- ❌ Creating tables manually in Supabase console
- ❌ No documentation of schema
- ❌ Risk of inconsistencies
- ❌ Can't reproduce in staging/production

## Development Workflow

### Adding a New Table

1. Edit `SCHEMA.sql` - add your new CREATE TABLE statement
2. Add indexes and RLS policies
3. Document the change in a comment
4. Run the SQL in Supabase
5. Commit to git

### Modifying Existing Table

For production databases, create a migration:

```sql
-- migrations/002_add_new_column.sql
ALTER TABLE leads ADD COLUMN new_field VARCHAR(255);
```

Then run it separately.

## Deployment Checklist

- [ ] `SCHEMA.sql` reviewed and committed to git
- [ ] `SETUP.md` is clear and up-to-date
- [ ] All RLS policies are tested
- [ ] Staging database matches production schema
- [ ] Team has access to Supabase project
- [ ] Backup created before any schema changes

## Support

For Supabase help:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

For schema questions:
- Check comments in `SCHEMA.sql`
- Review RLS policies at end of file
