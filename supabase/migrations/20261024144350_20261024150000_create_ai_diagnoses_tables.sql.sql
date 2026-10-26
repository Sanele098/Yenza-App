/*
# Create AI diagnosis history and conversation tables

1. New Tables
- `ai_diagnoses` — stores each Gemini-powered diagnosis a worker requests.
  - id (uuid PK)
  - worker_id (uuid, FK to profiles, defaults to auth.uid())
  - job_id (uuid, nullable, FK to jobs — links diagnosis to a specific job if selected)
  - mode ('learn' | 'do')
  - language ('en' | 'zu')
  - description (text — the worker's original problem description)
  - photo_url (text, nullable — storage path if a photo was uploaded)
  - problem_title (text)
  - explanation (text)
  - safety_warning (text)
  - needs_professional (boolean)
  - tools (jsonb — array of {name, essential})
  - steps (jsonb — array of {title, instruction, safetyNote})
  - estimated_time (text)
  - estimated_cost (text)
  - confidence (text — 'low' | 'medium' | 'high')
  - created_at (timestamptz default now())

- `ai_conversations` — stores follow-up Q&A messages tied to a diagnosis.
  - id (uuid PK)
  - diagnosis_id (uuid, FK to ai_diagnoses ON DELETE CASCADE)
  - worker_id (uuid, FK to profiles, defaults to auth.uid())
  - role ('worker' | 'ai')
  - message (text)
  - created_at (timestamptz default now())

2. Security
- Both tables have RLS enabled.
- Only authenticated users can access their own rows (worker_id = auth.uid()).
- Four CRUD policies per table, scoped to authenticated role.
- Grants: SELECT, INSERT, UPDATE, DELETE on ai_diagnoses to authenticated.
  SELECT, INSERT on ai_conversations to authenticated (workers insert both sides).
- service_role granted access for edge function writes.
*/

CREATE TABLE IF NOT EXISTS ai_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'do' CHECK (mode IN ('learn', 'do')),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zu')),
  description text NOT NULL,
  photo_url text,
  problem_title text NOT NULL,
  explanation text NOT NULL,
  safety_warning text NOT NULL,
  needs_professional boolean NOT NULL DEFAULT false,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_time text NOT NULL DEFAULT '',
  estimated_cost text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_diagnoses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_diagnoses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_diagnoses TO service_role;

DROP POLICY IF EXISTS "select_own_ai_diagnoses" ON ai_diagnoses;
CREATE POLICY "select_own_ai_diagnoses" ON ai_diagnoses FOR SELECT
  TO authenticated USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "insert_own_ai_diagnoses" ON ai_diagnoses;
CREATE POLICY "insert_own_ai_diagnoses" ON ai_diagnoses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "update_own_ai_diagnoses" ON ai_diagnoses;
CREATE POLICY "update_own_ai_diagnoses" ON ai_diagnoses FOR UPDATE
  TO authenticated USING (auth.uid() = worker_id) WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "delete_own_ai_diagnoses" ON ai_diagnoses;
CREATE POLICY "delete_own_ai_diagnoses" ON ai_diagnoses FOR DELETE
  TO authenticated USING (auth.uid() = worker_id);

CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_worker_id ON ai_diagnoses(worker_id);
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_created_at ON ai_diagnoses(created_at DESC);

-- ---- Conversations ----

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id uuid NOT NULL REFERENCES ai_diagnoses(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('worker', 'ai')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO service_role;

DROP POLICY IF EXISTS "select_own_ai_conversations" ON ai_conversations;
CREATE POLICY "select_own_ai_conversations" ON ai_conversations FOR SELECT
  TO authenticated USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "insert_own_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_own_ai_conversations" ON ai_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "update_own_ai_conversations" ON ai_conversations;
CREATE POLICY "update_own_ai_conversations" ON ai_conversations FOR UPDATE
  TO authenticated USING (auth.uid() = worker_id) WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "delete_own_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_own_ai_conversations" ON ai_conversations FOR DELETE
  TO authenticated USING (auth.uid() = worker_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_diagnosis_id ON ai_conversations(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_worker_id ON ai_conversations(worker_id);
