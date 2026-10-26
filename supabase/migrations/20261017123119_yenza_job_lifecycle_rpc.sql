/*
# Yenza job lifecycle — SECURITY DEFINER RPC functions

## Summary
Creates atomic PostgreSQL functions that enforce the job lifecycle rules.
These are the ONLY way job status and assignment change — RLS prevents
direct updates to jobs.assigned_worker_id and jobs.status by workers.

## Functions created:

### claim_job (instant_accept mode)
Atomically assigns a worker to an open job. The WHERE clause ensures
only one worker can win the race. Returns the job row or an error.

### apply_for_job (application mode)
Submits a worker's application for an open job. Enforces no duplicates,
job must be open, deadline not passed.

### select_worker (employer action)
Employer selects an application and atomically assigns that worker.
Rejects all other pending applications. Must be called by job owner.

### start_job
Assigned worker marks the job as in_progress.

### submit_completion
Assigned worker submits completion → awaiting_confirmation.

### confirm_completion
Employer confirms completion → completed.

### cancel_job
Employer or assigned worker cancels. Records who cancelled and why.
For employer cancelling before assignment: job goes to cancelled directly.

### reopen_job
Employer reopens a cancelled job → open, clears assignment.

## Security
All functions are SECURITY DEFINER so they bypass RLS to perform
the atomic UPDATE. They verify auth.uid() internally to ensure
the caller is authorized. Search path set to safe value.

## Important Notes
1. All functions use auth.uid() to identify the caller — never trust
   a client-supplied user ID.
2. claim_job uses a single UPDATE...RETURNING with a WHERE guard —
   PostgreSQL row-level locking ensures atomicity.
3. No client can bypass these functions because RLS blocks direct
   updates to status/assigned_worker_id for non-owners.
*/

-- Set safe search path for all functions
SET search_path = public, auth;

-- ============================================================
-- claim_job: atomic instant-accept assignment
-- ============================================================
CREATE OR REPLACE FUNCTION claim_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_worker_id uuid := auth.uid();
  v_result jsonb;
  v_row RECORD;
BEGIN
  IF v_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Must be a worker
  SELECT role INTO v_row FROM profiles WHERE id = v_worker_id;
  IF v_row.role IS DISTINCT FROM 'worker' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only workers can claim jobs');
  END IF;

  -- Atomic claim: only succeeds if job is open, no worker assigned, not expired,
  -- in instant_accept mode, and worker is not the employer
  UPDATE jobs
  SET
    assigned_worker_id = v_worker_id,
    status = 'assigned',
    assigned_at = now(),
    updated_at = now()
  WHERE id = p_job_id
    AND status = 'open'
    AND assigned_worker_id IS NULL
    AND fulfillment_mode = 'instant_accept'
    AND employer_id != v_worker_id
    AND (application_deadline IS NULL OR application_deadline > now())
  RETURNING id, title, status, assigned_worker_id, assigned_at INTO v_row;

  IF NOT FOUND THEN
    -- Determine why it failed
    SELECT status, assigned_worker_id, fulfillment_mode, employer_id INTO v_row
    FROM jobs WHERE id = p_job_id;
    IF v_row.status = 'open' AND v_row.assigned_worker_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Job already taken');
    ELSIF v_row.status IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Job not found');
    ELSIF v_row.employer_id = v_worker_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'You cannot claim your own job');
    ELSIF v_row.fulfillment_mode != 'instant_accept' THEN
      RETURN jsonb_build_object('success', false, 'error', 'This job requires an application');
    ELSIF v_row.status != 'open' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Job is no longer available');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Job could not be claimed');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_row.id,
    'title', v_row.title,
    'status', v_row.status,
    'assigned_worker_id', v_row.assigned_worker_id,
    'assigned_at', v_row.assigned_at
  );
END;
$$;

-- ============================================================
-- apply_for_job: submit application for application-mode jobs
-- ============================================================
CREATE OR REPLACE FUNCTION apply_for_job(
  p_job_id uuid,
  p_message text DEFAULT '',
  p_proposed_price numeric DEFAULT NULL,
  p_estimated_duration text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_worker_id uuid := auth.uid();
  v_job RECORD;
BEGIN
  IF v_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Must be a worker
  SELECT role INTO v_job FROM profiles WHERE id = v_worker_id;
  IF v_job.role IS DISTINCT FROM 'worker' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only workers can apply');
  END IF;

  -- Check job is open, application mode, not expired, not own job
  SELECT status, fulfillment_mode, employer_id, application_deadline INTO v_job
  FROM jobs WHERE id = p_job_id;

  IF v_job.status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;
  IF v_job.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is no longer accepting applications');
  END IF;
  IF v_job.fulfillment_mode != 'application' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This job uses instant acceptance');
  END IF;
  IF v_job.employer_id = v_worker_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot apply to your own job');
  END IF;
  IF v_job.application_deadline IS NOT NULL AND v_job.application_deadline <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application deadline has passed');
  END IF;

  -- Insert application (unique constraint prevents duplicates)
  BEGIN
    INSERT INTO job_applications (job_id, worker_id, message, proposed_price, estimated_duration, status)
    VALUES (p_job_id, v_worker_id, p_message, p_proposed_price, p_estimated_duration, 'pending');
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already applied for this job');
  END;

  RETURN jsonb_build_object('success', true, 'job_id', p_job_id);
END;
$$;

-- ============================================================
-- select_worker: employer selects an application
-- ============================================================
CREATE OR REPLACE FUNCTION select_worker(p_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employer_id uuid := auth.uid();
  v_app RECORD;
  v_assigned boolean;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Load the application with job info
  SELECT ja.job_id, ja.worker_id, ja.status, j.status AS job_status, j.employer_id
  INTO v_app
  FROM job_applications ja
  JOIN jobs j ON j.id = ja.job_id
  WHERE ja.id = p_application_id;

  IF v_app.job_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;
  IF v_app.employer_id != v_employer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the job owner can select a worker');
  END IF;
  IF v_app.job_status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is no longer open');
  END IF;
  IF v_app.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This application is no longer active');
  END IF;

  -- Atomic assignment: only succeeds if job is still open
  UPDATE jobs
  SET
    assigned_worker_id = v_app.worker_id,
    status = 'assigned',
    assigned_at = now(),
    updated_at = now()
  WHERE id = v_app.job_id
    AND status = 'open'
    AND assigned_worker_id IS NULL
  RETURNING id INTO v_assigned;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job was already assigned');
  END IF;

  -- Mark selected application as accepted
  UPDATE job_applications SET status = 'accepted', updated_at = now()
  WHERE id = p_application_id;

  -- Reject all other pending applications for this job
  UPDATE job_applications SET status = 'closed', updated_at = now()
  WHERE job_id = v_app.job_id AND status = 'pending';

  RETURN jsonb_build_object('success', true, 'job_id', v_app.job_id, 'worker_id', v_app.worker_id);
END;
$$;

-- ============================================================
-- start_job: assigned worker begins work
-- ============================================================
CREATE OR REPLACE FUNCTION start_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_worker_id uuid := auth.uid();
  v_result RECORD;
BEGIN
  IF v_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE jobs
  SET status = 'in_progress', started_at = now(), updated_at = now()
  WHERE id = p_job_id
    AND status = 'assigned'
    AND assigned_worker_id = v_worker_id
  RETURNING id, title, status INTO v_result;

  IF NOT FOUND THEN
    SELECT status, assigned_worker_id INTO v_result FROM jobs WHERE id = p_job_id;
    IF v_result.status IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Job not found');
    ELSIF v_result.assigned_worker_id != v_worker_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'You are not assigned to this job');
    ELSIF v_result.status != 'assigned' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Job is not in an assignable state');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Could not start job');
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', v_result.id, 'status', v_result.status);
END;
$$;

-- ============================================================
-- submit_completion: worker marks work done → awaiting_confirmation
-- ============================================================
CREATE OR REPLACE FUNCTION submit_completion(
  p_job_id uuid,
  p_notes text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_worker_id uuid := auth.uid();
  v_result RECORD;
BEGIN
  IF v_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE jobs
  SET
    status = 'awaiting_confirmation',
    completion_details = jsonb_build_object('notes', p_notes, 'submitted_at', now()::text),
    updated_at = now()
  WHERE id = p_job_id
    AND status = 'in_progress'
    AND assigned_worker_id = v_worker_id
  RETURNING id, status INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not in progress or you are not the assigned worker');
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', v_result.id, 'status', v_result.status);
END;
$$;

-- ============================================================
-- confirm_completion: employer confirms → completed
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_completion(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employer_id uuid := auth.uid();
  v_result RECORD;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE jobs
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_job_id
    AND status = 'awaiting_confirmation'
    AND employer_id = v_employer_id
  RETURNING id, status INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not awaiting confirmation or you are not the employer');
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', v_result.id, 'status', v_result.status);
END;
$$;

-- ============================================================
-- cancel_job: employer or assigned worker cancels
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_job(
  p_job_id uuid,
  p_reason text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_job RECORD;
  v_cancelled_by text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, employer_id, assigned_worker_id INTO v_job
  FROM jobs WHERE id = p_job_id;

  IF v_job.status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;

  -- Determine who is cancelling
  IF v_job.employer_id = v_user_id THEN
    v_cancelled_by := 'employer';
  ELSIF v_job.assigned_worker_id = v_user_id THEN
    v_cancelled_by := 'worker';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to cancel this job');
  END IF;

  -- Cannot cancel already completed/cancelled jobs
  IF v_job.status IN ('completed', 'cancelled', 'expired') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job cannot be cancelled in its current state');
  END IF;

  UPDATE jobs
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    cancellation_by = v_cancelled_by,
    updated_at = now()
  WHERE id = p_job_id
    AND status NOT IN ('completed', 'cancelled', 'expired');

  -- Close any pending applications
  UPDATE job_applications SET status = 'closed', updated_at = now()
  WHERE job_id = p_job_id AND status = 'pending';

  RETURN jsonb_build_object('success', true, 'job_id', p_job_id, 'cancelled_by', v_cancelled_by);
END;
$$;

-- ============================================================
-- reopen_job: employer reopens a cancelled job
-- ============================================================
CREATE OR REPLACE FUNCTION reopen_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_employer_id uuid := auth.uid();
  v_result RECORD;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE jobs
  SET
    status = 'open',
    assigned_worker_id = NULL,
    assigned_at = NULL,
    started_at = NULL,
    cancelled_at = NULL,
    cancellation_reason = '',
    cancellation_by = NULL,
    updated_at = now()
  WHERE id = p_job_id
    AND status = 'cancelled'
    AND employer_id = v_employer_id
  RETURNING id, status INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job cannot be reopened');
  END IF;

  -- Reset applications to pending if they were closed due to cancellation
  UPDATE job_applications SET status = 'pending', updated_at = now()
  WHERE job_id = p_job_id AND status = 'closed';

  RETURN jsonb_build_object('success', true, 'job_id', v_result.id, 'status', v_result.status);
END;
$$;

-- ============================================================
-- Grant execute to authenticated role
-- ============================================================

GRANT EXECUTE ON FUNCTION claim_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_for_job(uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION select_worker(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION start_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_completion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_job(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION reopen_job(uuid) TO authenticated;
