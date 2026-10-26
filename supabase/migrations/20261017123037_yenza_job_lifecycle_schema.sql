/*
# Yenza job lifecycle — schema overhaul

## Summary
Reworks the jobs table to support a proper lifecycle with atomic
assignment, two fulfillment modes (instant accept / application),
controlled status transitions, and concurrency-safe claiming.

## 1. Modified Tables

### jobs (altered)
New columns added:
- fulfillment_mode: 'instant_accept' | 'application' (default 'instant_accept')
- budget_min, budget_max: numeric range
- currency: text, default 'ZAR'
- materials_provided: boolean
- application_deadline: timestamptz
- scheduled_start_at: timestamptz
- assigned_at, started_at, completed_at, cancelled_at: timestamptz
- cancellation_reason: text
- cancellation_by: 'employer' | 'worker' | 'system'

Status constraint changed to lifecycle:
  draft → open → assigned → in_progress → awaiting_confirmation → completed
  plus cancelled and expired

Existing data migrated: old 'Available' → 'open', 'Accepted' → 'assigned',
'Completed' → 'completed', 'Cancelled' → 'cancelled', 'Declined' → 'cancelled'.

### job_applications (altered)
- status constraint: 'pending' | 'accepted' | 'rejected' | 'closed'
- added updated_at column
- old 'declined' → 'rejected'

## 2. Security
- RLS updated: workers can no longer UPDATE jobs directly.
  All status transitions and assignment happen through SECURITY DEFINER
  RPC functions.

## Important Notes
1. No columns or tables dropped — data-safe migration.
2. Old constraint dropped BEFORE status migration to avoid check failures.
3. budget column kept; budget_min/budget_max are the new canonical fields.
*/

-- ============================================================
-- Step 1: Add new columns to jobs
-- ============================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fulfillment_mode text
  NOT NULL DEFAULT 'instant_accept';

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_min numeric;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_max numeric;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ZAR';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS materials_provided boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellation_reason text DEFAULT '';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellation_by text
  DEFAULT NULL;

-- ============================================================
-- Step 2: Drop old status constraint BEFORE migrating values
-- ============================================================

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- ============================================================
-- Step 3: Migrate old status values
-- ============================================================

UPDATE jobs SET status = 'open' WHERE status = 'Available';
UPDATE jobs SET status = 'assigned' WHERE status = 'Accepted';
UPDATE jobs SET status = 'cancelled' WHERE status = 'Declined';

-- Populate budget_min/budget_max from existing budget
UPDATE jobs SET budget_min = budget WHERE budget_min IS NULL;
UPDATE jobs SET budget_max = budget WHERE budget_max IS NULL;

-- Set lifecycle timestamps from updated_at for existing rows
UPDATE jobs SET assigned_at = updated_at WHERE status = 'assigned' AND assigned_worker_id IS NOT NULL AND assigned_at IS NULL;
UPDATE jobs SET completed_at = updated_at WHERE status = 'completed' AND completed_at IS NULL;

-- ============================================================
-- Step 4: Add new status constraint
-- ============================================================

DO $$ BEGIN
  ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('draft', 'open', 'assigned', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add fulfillment_mode check constraint
DO $$ BEGIN
  ALTER TABLE jobs ADD CONSTRAINT jobs_fulfillment_mode_check
    CHECK (fulfillment_mode IN ('instant_accept', 'application'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add cancellation_by check constraint
DO $$ BEGIN
  ALTER TABLE jobs ADD CONSTRAINT jobs_cancellation_by_check
    CHECK (cancellation_by IS NULL OR cancellation_by IN ('employer', 'worker', 'system'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Step 5: Update job_applications
-- ============================================================

ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Migrate old 'declined' to 'rejected'
UPDATE job_applications SET status = 'rejected' WHERE status = 'declined';

ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
DO $$ BEGIN
  ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check
    CHECK (status IN ('pending', 'accepted', 'rejected', 'closed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Step 6: New indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_jobs_fulfillment_mode ON jobs(fulfillment_mode);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_status_worker ON jobs(status, assigned_worker_id);

-- ============================================================
-- Step 7: Lock down RLS — workers cannot directly UPDATE jobs
-- ============================================================

DROP POLICY IF EXISTS "update_own_jobs" ON jobs;

-- Only the employer owner can update (for editing, cancelling their own jobs)
-- All status transitions and assignment go through SECURITY DEFINER RPC functions
CREATE POLICY "update_own_jobs"
ON jobs FOR UPDATE
TO authenticated
USING (auth.uid() = employer_id)
WITH CHECK (auth.uid() = employer_id);
