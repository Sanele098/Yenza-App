/*
# Create waitlist table for Yenza website

1. New Tables
- `waitlist_entries`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users, nullable — linked after signup)
  - `email` (text, unique, not null)
  - `full_name` (text, not null)
  - `phone` (text, not null)
  - `role` (text, not null — 'worker' | 'employer')
  - `location` (text, not null)
  - `account_type` (text, nullable — employer sub-type)
  - `services` (jsonb, nullable — worker selected services)
  - `service_areas` (jsonb, nullable — worker selected service areas)
  - `availability_days` (jsonb, nullable — worker selected days)
  - `experience_level` (text, nullable)
  - `goals` (text, nullable)
  - `bio` (text, nullable)
  - `identity_verified` (boolean, default false)
  - `qualifications_verified` (boolean, default false)
  - `app_access_granted` (boolean, default false — set true when app is available to them)
  - `waitlist_position` (integer, auto-incrementing via identity)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `waitlist_entries`.
- Grant SELECT, INSERT, UPDATE to `authenticated` (waitlist requires sign-in so we can show the user their own entry).
- Owner-scoped policies: each authenticated user can read/update only their own waitlist entry (matched by `user_id = auth.uid()`).
- `service_role` granted full CRUD for admin/edge-function use.
- `waitlist_position_seq` granted USAGE to `authenticated` for the identity column.

3. Important notes
- The website creates an auth account (Supabase auth) and then inserts a waitlist row linked to that user.
- A user can see their own entry to view what verification is outstanding.
- No one can see other users' waitlist entries.
- `waitlist_position` is an identity column so it auto-increments — the first person to join is #1, etc.
*/

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('worker', 'employer')),
  location text NOT NULL,
  account_type text,
  services jsonb DEFAULT '[]'::jsonb,
  service_areas jsonb DEFAULT '[]'::jsonb,
  availability_days jsonb DEFAULT '[]'::jsonb,
  experience_level text,
  goals text,
  bio text,
  identity_verified boolean NOT NULL DEFAULT false,
  qualifications_verified boolean NOT NULL DEFAULT false,
  app_access_granted boolean NOT NULL DEFAULT false,
  waitlist_position integer GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON waitlist_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON waitlist_entries TO service_role;

DROP POLICY IF EXISTS "select_own_waitlist" ON waitlist_entries;
CREATE POLICY "select_own_waitlist"
  ON waitlist_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_waitlist" ON waitlist_entries;
CREATE POLICY "insert_own_waitlist"
  ON waitlist_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_waitlist" ON waitlist_entries;
CREATE POLICY "update_own_waitlist"
  ON waitlist_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT USAGE ON SEQUENCE waitlist_entries_waitlist_position_seq TO authenticated;
