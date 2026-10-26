/*
# Protect in-progress jobs from deletion

## Problem
Employers could delete jobs even after a worker accepted and started working on them.
This is destructive — it removes the job from the worker's active list and loses all
progress data.

## Changes
1. Replace the DELETE policy on `jobs` to only allow deletion when:
   - The job is owned by the authenticated user (employer), AND
   - The job status is NOT in ('assigned', 'in_progress', 'awaiting_confirmation')
     — i.e., no worker is actively engaged with the job.
2. Jobs in 'open', 'completed', 'cancelled', 'expired', or 'draft' status can still
   be deleted by the employer.

## Security
- DELETE policy scoped to `authenticated` with ownership check via `auth.uid()`.
- The status guard prevents deletion of any job where a worker has been engaged.
*/

DROP POLICY IF EXISTS "delete_own_jobs" ON jobs;

CREATE POLICY "delete_own_jobs"
ON jobs FOR DELETE
TO authenticated
USING (
  auth.uid() = employer_id
  AND status NOT IN ('assigned', 'in_progress', 'awaiting_confirmation')
);
