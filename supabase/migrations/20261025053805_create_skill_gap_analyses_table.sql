/*
# Create skill_gap_analyses table

Stores AI-generated skill gap analysis for each worker, cached so the app
doesn't query Gemini on every login. Each worker has at most one analysis row
(unique on worker_id). The analysis contains the current skill snapshot,
AI-generated learning path milestones, and a summary.

1. New Tables
- `skill_gap_analyses`
  - `id` (uuid, primary key)
  - `worker_id` (uuid, not null, references auth.users, unique — one analysis per worker)
  - `current_skills` (jsonb, list of skill names the worker currently offers)
  - `experience_level` (text, worker's experience level at time of analysis)
  - `location` (text, worker's location at time of analysis)
  - `summary` (text, AI-generated plain-language summary of where the worker stands)
  - `milestones` (jsonb, array of milestone objects: { id, skill, title, description, status, steps, estimatedTime, resources })
  - `skill_snapshot_hash` (text, hash of current skills+experience for change detection)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz, auto-updated)

2. Security
- Enable RLS on `skill_gap_analyses`.
- Grant CRUD to `authenticated` only (app has sign-in).
- Grant CRUD to `service_role` (edge function uses service role key).
- Owner-scoped CRUD: each authenticated worker can only access their own row.
*/

CREATE TABLE IF NOT EXISTS skill_gap_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  current_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience_level text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_snapshot_hash text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE skill_gap_analyses ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS skill_gap_analyses_worker_id_key
  ON skill_gap_analyses (worker_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON skill_gap_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON skill_gap_analyses TO service_role;

DROP POLICY IF EXISTS "select_own_skill_gap" ON skill_gap_analyses;
CREATE POLICY "select_own_skill_gap" ON skill_gap_analyses
  FOR SELECT TO authenticated USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "insert_own_skill_gap" ON skill_gap_analyses;
CREATE POLICY "insert_own_skill_gap" ON skill_gap_analyses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "update_own_skill_gap" ON skill_gap_analyses;
CREATE POLICY "update_own_skill_gap" ON skill_gap_analyses
  FOR UPDATE TO authenticated USING (auth.uid() = worker_id) WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "delete_own_skill_gap" ON skill_gap_analyses;
CREATE POLICY "delete_own_skill_gap" ON skill_gap_analyses
  FOR DELETE TO authenticated USING (auth.uid() = worker_id);
