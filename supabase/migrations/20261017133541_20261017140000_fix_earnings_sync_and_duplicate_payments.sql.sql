/*
# Fix Earnings Sync, Backfill Missing Earnings, Prevent Duplicate Payments

## Problem
1. Some completed jobs have no earning row (job completed before the
   confirm_completion RPC was updated to create earnings).
2. The employer can record payment multiple times for the same job,
   creating duplicate payment rows.
3. record_payment only updates existing earnings with status='pending'.
   If an earning was never created, the payment is recorded but the
   worker never sees the money.

## Changes
1. Backfill missing earnings for completed jobs with assigned workers.
2. Clean up duplicate payments (keep earliest per job by created_at).
3. Add unique constraint on payments.job_id.
4. Rewrite record_payment: prevent duplicates, create earning if missing.
5. Rewrite confirm_completion: idempotent earning creation.
*/

-- 1. Backfill missing earnings
INSERT INTO earnings (worker_id, job_id, employer_id, amount, currency, status)
SELECT
  j.assigned_worker_id,
  j.id,
  j.employer_id,
  COALESCE(j.agreed_price, j.budget_max, j.budget_min, j.budget, 0),
  'ZAR',
  'pending'
FROM jobs j
WHERE j.status = 'completed'
  AND j.assigned_worker_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM earnings e WHERE e.job_id = j.id);

-- 2. Clean up duplicate payments: keep only the earliest payment per job
DELETE FROM payments p
WHERE p.id IN (
  SELECT p2.id FROM payments p2
  LEFT JOIN LATERAL (
    SELECT p3.id AS keep_id FROM payments p3
    WHERE p3.job_id = p2.job_id
    ORDER BY p3.created_at ASC, p3.id ASC
    LIMIT 1
  ) keep ON true
  WHERE p2.id != keep.keep_id
);

-- Update earnings.payment_id to point to remaining payment
UPDATE earnings e
SET payment_id = sub.payment_id, updated_at = now()
FROM (
  SELECT e2.job_id, p.id AS payment_id
  FROM earnings e2
  JOIN payments p ON p.job_id = e2.job_id
  WHERE e2.payment_id IS NULL
  GROUP BY e2.job_id, p.id
) sub
WHERE e.job_id = sub.job_id;

-- 3. Unique constraint on payments.job_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_job_id_unique_key'
      AND conrelid = 'payments'::regclass
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_job_id_unique_key UNIQUE (job_id);
  END IF;
END $$;

-- 4. Rewrite record_payment RPC
CREATE OR REPLACE FUNCTION public.record_payment(p_job_id uuid, p_method text, p_reference text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_employer_id uuid := auth.uid();
  v_job RECORD;
  v_payment_id uuid;
  v_earning_id uuid;
  v_amount numeric;
  v_new_status text;
  v_existing_payment_id uuid;
BEGIN
  IF v_employer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_method NOT IN ('cash', 'eft', 'card') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment method');
  END IF;

  SELECT status, employer_id, assigned_worker_id,
    COALESCE(agreed_price, budget_max, budget_min, budget, 0) AS earn_amount
  INTO v_job
  FROM jobs WHERE id = p_job_id;

  IF v_job.status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;
  IF v_job.employer_id != v_employer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the job owner can record payment');
  END IF;
  IF v_job.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job must be completed before recording payment');
  END IF;
  IF v_job.assigned_worker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No worker assigned to this job');
  END IF;

  SELECT id INTO v_existing_payment_id FROM payments WHERE job_id = p_job_id LIMIT 1;
  IF v_existing_payment_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment has already been recorded for this job');
  END IF;

  v_amount := v_job.earn_amount;
  v_new_status := CASE WHEN p_method = 'cash' THEN 'cash_pending' ELSE 'available' END;

  INSERT INTO payments (job_id, employer_id, worker_id, amount, method, status, reference)
  VALUES (p_job_id, v_employer_id, v_job.assigned_worker_id, v_amount, p_method, 'completed', p_reference)
  RETURNING id INTO v_payment_id;

  SELECT id INTO v_earning_id FROM earnings WHERE job_id = p_job_id LIMIT 1;
  IF v_earning_id IS NULL THEN
    INSERT INTO earnings (worker_id, job_id, employer_id, amount, currency, status, payment_id)
    VALUES (v_job.assigned_worker_id, p_job_id, v_employer_id, v_amount, 'ZAR', v_new_status, v_payment_id)
    RETURNING id INTO v_earning_id;
  ELSE
    UPDATE earnings
    SET status = v_new_status, payment_id = v_payment_id, updated_at = now()
    WHERE id = v_earning_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'earning_id', v_earning_id,
    'amount', v_amount,
    'method', p_method,
    'earning_status', v_new_status
  );
END;
$function$;

-- 5. Rewrite confirm_completion RPC (idempotent)
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
    COALESCE(agreed_price, budget_max, budget_min, budget, 0) AS earn_amount
  INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not awaiting confirmation or you are not the employer');
  END IF;

  v_amount := v_result.earn_amount;
  v_worker_id := v_result.assigned_worker_id;

  IF v_worker_id IS NOT NULL THEN
    SELECT id INTO v_existing_earning_id FROM earnings WHERE job_id = p_job_id LIMIT 1;
    IF v_existing_earning_id IS NULL THEN
      INSERT INTO earnings (worker_id, job_id, employer_id, amount, currency, status)
      VALUES (v_worker_id, p_job_id, v_employer_id, v_amount, 'ZAR', 'pending');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_result.id,
    'status', v_result.status,
    'earning_amount', v_amount
  );
END;
$function$;
