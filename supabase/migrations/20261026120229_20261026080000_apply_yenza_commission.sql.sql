/*
# Apply 10% Yenza commission on earnings

## Summary
Yenza charges a 10% commission fee on every completed job. The worker
receives 90% of the job amount (net); Yenza keeps 10% (commission).
This migration adds the columns to track the split, backfills existing
earnings rows, and updates the RPC functions that create earnings so
every new earning stores the gross, commission, and net amounts.

## Column changes on `earnings`
- `gross_amount` numeric NOT NULL DEFAULT 0 — full amount the employer pays
- `commission_amount` numeric NOT NULL DEFAULT 0 — 10% Yenza commission
- `amount` (existing) — now represents the worker's NET pay (90% of gross),
  which is what the worker can withdraw

## Backfill
Existing earnings rows currently store the full job amount in `amount`.
For each row: gross_amount = old amount, commission_amount = round(old * 0.10),
amount = old amount - commission_amount (the worker's net).

## Updated functions
- `submit_completion`: computes gross from job price, sets commission = 10%,
  amount = gross - commission (net).
- `confirm_completion`: same computation for the earning it creates.

## Notes
1. `amount` continues to be the withdrawable balance — now it is the net pay.
2. The `payments` table still records the full gross amount the employer paid.
3. No data is lost; every existing row gets a matching gross + commission pair.
*/

-- ============================================================
-- Add commission columns to earnings
-- ============================================================
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS gross_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0;

-- ============================================================
-- Backfill existing rows: split the current amount into gross/commission/net
-- ============================================================
UPDATE earnings
SET
  gross_amount = amount,
  commission_amount = ROUND(amount * 0.10, 2),
  amount = amount - ROUND(amount * 0.10, 2)
WHERE gross_amount = 0;

-- ============================================================
-- submit_completion: create earning with 90/10 split
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_completion(p_job_id uuid, p_notes text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_worker_id uuid := auth.uid();
  v_result RECORD;
  v_gross numeric;
  v_commission numeric;
  v_net numeric;
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

  v_gross := v_result.earn_amount;
  v_commission := ROUND(v_gross * 0.10, 2);
  v_net := v_gross - v_commission;
  v_employer_id := v_result.employer_id;

  -- Create pending earning if one doesn't exist yet
  SELECT id INTO v_existing_earning_id FROM earnings WHERE job_id = p_job_id LIMIT 1;
  IF v_existing_earning_id IS NULL THEN
    INSERT INTO earnings (worker_id, job_id, employer_id, amount, gross_amount, commission_amount, currency, status)
    VALUES (v_worker_id, p_job_id, v_employer_id, v_net, v_gross, v_commission, 'ZAR', 'pending');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_result.id,
    'status', v_result.status,
    'gross_amount', v_gross,
    'commission_amount', v_commission,
    'net_amount', v_net
  );
END;
$function$;

-- ============================================================
-- confirm_completion: create earning with 90/10 split (fallback path)
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
  v_gross numeric;
  v_commission numeric;
  v_net numeric;
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

  v_gross := v_result.earn_amount;
  v_commission := ROUND(v_gross * 0.10, 2);
  v_net := v_gross - v_commission;
  v_worker_id := v_result.assigned_worker_id;

  IF v_worker_id IS NOT NULL THEN
    SELECT id INTO v_existing_earning_id FROM earnings WHERE job_id = p_job_id;
    IF v_existing_earning_id IS NULL THEN
      INSERT INTO earnings (worker_id, job_id, employer_id, amount, gross_amount, commission_amount, currency, status)
      VALUES (v_worker_id, p_job_id, v_employer_id, v_net, v_gross, v_commission, 'ZAR', 'pending');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_result.id,
    'status', v_result.status,
    'gross_amount', v_gross,
    'commission_amount', v_commission,
    'net_amount', v_net
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_completion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_completion(uuid) TO authenticated;
