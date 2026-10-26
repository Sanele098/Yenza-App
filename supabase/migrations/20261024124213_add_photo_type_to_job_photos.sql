ALTER TABLE job_photos ADD COLUMN IF NOT EXISTS photo_type text NOT NULL DEFAULT 'work';

DROP POLICY IF EXISTS "select_job_photos" ON job_photos;
CREATE POLICY "select_job_photos"
ON job_photos FOR SELECT
TO authenticated
USING (
  photo_type = 'listing'
  OR auth.uid() = worker_id
  OR EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_photos.job_id AND jobs.employer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_job_photos" ON job_photos;
CREATE POLICY "insert_job_photos"
ON job_photos FOR INSERT
TO authenticated
WITH CHECK (
  (photo_type = 'listing' AND EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_photos.job_id AND jobs.employer_id = auth.uid()
  ))
  OR
  (photo_type = 'work' AND auth.uid() = worker_id AND EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_photos.job_id AND jobs.assigned_worker_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "delete_job_photos" ON job_photos;
CREATE POLICY "delete_job_photos"
ON job_photos FOR DELETE
TO authenticated
USING (
  auth.uid() = worker_id
  OR EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_photos.job_id AND jobs.employer_id = auth.uid()
  )
);