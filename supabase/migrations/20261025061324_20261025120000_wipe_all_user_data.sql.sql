-- Wipe all user/demo data from every table, keep structures intact.
-- Order respects foreign-key dependencies.

-- 1. Delete child/dependent rows first
DELETE FROM ai_conversations;
DELETE FROM ai_diagnoses;
DELETE FROM skill_gap_analyses;
DELETE FROM job_photos;
DELETE FROM job_files;
DELETE FROM job_applications;
DELETE FROM reviews;
DELETE FROM withdrawals;
DELETE FROM earnings;
DELETE FROM payments;
DELETE FROM worker_credentials;
DELETE FROM worker_services;
DELETE FROM jobs;
DELETE FROM profiles;

-- 2. Empty the service catalog so the new data set starts clean
DELETE FROM services;

-- 3. Reset sequences (safe; only affects auto-id columns if any)
ALTER SEQUENCE IF EXISTS jobs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS withdrawals_id_seq RESTART WITH 1;

-- 4. Remove the matching auth.users rows for the deleted profiles
DELETE FROM auth.users
WHERE id IN (
  '66720f0c-3212-4ad3-bd11-be74cc1e2560',
  'f09edf03-d063-4bc9-a6cd-d2c1072c1221',
  '32538a41-181c-453e-91e9-1d0ca01cd200'
);

-- 5. Storage: remove all objects from the file buckets so leftover demo photos don't linger
-- (Run as a DO block since storage.objects lives in the storage schema.)
DO $$
DECLARE
  bucket_record RECORD;
BEGIN
  FOR bucket_record IN SELECT id FROM storage.buckets
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM storage.objects WHERE bucket_id = %L', bucket_record.id);
    EXCEPTION WHEN OTHERS THEN
      -- ignore if a bucket is not deletable via SQL for any reason
      NULL;
    END;
  END LOOP;
END $$;
