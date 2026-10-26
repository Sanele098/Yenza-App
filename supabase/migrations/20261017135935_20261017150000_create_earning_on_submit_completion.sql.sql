/*
# Create earning on worker completion submission

## Problem
The earning was only created when the employer confirmed completion.
Per the business rule, the earning should be created as 'pending' when
the worker marks the job as complete (submit_completion), then moved to
'available' (card) or 'cash_completed' (cash) when the employer confirms.

## Changes
1. Rewrite submit_completion to create a 'pending' earning when the worker
   submits completion. Idempotent — won't create a duplicate if one exists.
2. confirm_completion already handles updating the earning status, so no
   change needed there.
*/

CREATE OR REPLACE FUNCTION public.submit_completion(p_job_id uuid, p_notes text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_worker_id uuid := auth.uid();
  v_result RECORD;
  v_amount numeric;
  v_employer_id uuid;
  v_existing_earning_id uuid;
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
  RETURNING id, status, employer_id,
    COALESCE(agreed_price, budget_max, budget_min, budget, 0) AS earn_amount
  INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not in progress or you are not the assigned worker');
  END IF;

  v_amount := v_result.earn_amount;
  v_employer_id := v_result.employer_id;

  -- Create pending earning if one doesn't exist yet
  SELECT id INTO v_existing_earning_id FROM earnings WHERE job_id = p_job_id LIMIT 1;
  IF v_existing_earning_id IS NULL THEN
    INSERT INTO earnings (worker_id, job_id, employer_id, amount, currency, status)
    VALUES (v_worker_id, p_job_id, v_employer_id, v_amount, 'ZAR', 'pending');
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', v_result.id, 'status', v_result.status);
END;
$function$;
