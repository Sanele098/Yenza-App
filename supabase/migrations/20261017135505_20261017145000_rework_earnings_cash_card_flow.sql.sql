/*
# Rework Earnings Flow: Card vs Cash on Completion

## Problem
The old flow had a "cash_pending" status where the worker had to confirm
they received cash. This is unnecessary — cash is settled in person
between employer and worker. Cash earnings should NOT count toward the
withdrawable (available) balance, since the worker already has the money.

## New Flow
1. Employer posts job and selects Cash or Card (final, stored on job).
2. Worker marks job complete → earning created with status='pending'.
3. Employer confirms completion:
   - Card payment → earning moves to 'available' (worker can withdraw)
   - Cash payment → earning moves to 'cash_completed' (counts toward
     Total Earnings only, NOT available for withdrawal)

## Changes
1. Add 'cash_completed' to the earning status check constraint.
2. Rewrite confirm_completion to look at preferred_payment_method and
   set the earning status accordingly:
   - 'card' → 'available'
   - 'cash' → 'cash_completed'
3. Remove the record_payment and confirm_cash_received RPCs — they are
   no longer needed. Payment method is decided upfront and finalized
   when the employer confirms completion.
4. Drop the unique constraint on payments.job_id (table may be unused
   now but we keep it for historical records).
*/

-- 1. Update earnings status check constraint to include 'cash_completed'
ALTER TABLE earnings DROP CONSTRAINT IF EXISTS earnings_status_check;
ALTER TABLE earnings ADD CONSTRAINT earnings_status_check
  CHECK (status IN ('pending', 'cash_completed', 'available', 'withdrawn'));

-- 2. Rewrite confirm_completion to set earning status based on payment method
CREATE OR REPLACE FUNCTION public.confirm_completion(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_employer_id uuid := auth.uid();
  v_result RECORD;
  v_amount numeric;
  v_worker_id uuid;
  v_existing_earning_id uuid;
  v_payment_method text;
  v_new_earning_status text;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE jobs
  SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_job_id
    AND status = 'awaiting_confirmation'
    AND employer_id = v_employer_id
  RETURNING id, title, status, assigned_worker_id,
    COALESCE(agreed_price, budget_max, budget_min, budget, 0) AS earn_amount,
    preferred_payment_method
  INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not awaiting confirmation or you are not the employer');
  END IF;

  v_amount := v_result.earn_amount;
  v_worker_id := v_result.assigned_worker_id;
  v_payment_method := v_result.preferred_payment_method;

  -- Determine earning status based on payment method
  v_new_earning_status := CASE WHEN v_payment_method = 'cash' THEN 'cash_completed' ELSE 'available' END;

  IF v_worker_id IS NOT NULL THEN
    SELECT id INTO v_existing_earning_id FROM earnings WHERE job_id = p_job_id LIMIT 1;
    IF v_existing_earning_id IS NULL THEN
      INSERT INTO earnings (worker_id, job_id, employer_id, amount, currency, status)
      VALUES (v_worker_id, p_job_id, v_employer_id, v_amount, 'ZAR', v_new_earning_status);
    ELSE
      UPDATE earnings
      SET status = v_new_earning_status, updated_at = now()
      WHERE id = v_existing_earning_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_result.id,
    'status', v_result.status,
    'earning_amount', v_amount,
    'earning_status', v_new_earning_status
  );
END;
$function$;
