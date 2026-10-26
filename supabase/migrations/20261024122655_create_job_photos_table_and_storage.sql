CREATE TABLE IF NOT EXISTS job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON job_photos TO authenticated;

DROP POLICY IF EXISTS "select_job_photos" ON job_photos;
CREATE POLICY "select_job_photos"
ON job_photos FOR SELECT
TO authenticated
USING (
  auth.uid() = worker_id
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
  auth.uid() = worker_id
  AND EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_photos.job_id
    AND jobs.assigned_worker_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete_job_photos" ON job_photos;
CREATE POLICY "delete_job_photos"
ON job_photos FOR DELETE
TO authenticated
USING (auth.uid() = worker_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job-photos', 'job-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "upload_job_photos" ON storage.objects;
CREATE POLICY "upload_job_photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');

DROP POLICY IF EXISTS "read_job_photos" ON storage.objects;
CREATE POLICY "read_job_photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

DROP POLICY IF EXISTS "delete_job_photos_storage" ON storage.objects;
CREATE POLICY "delete_job_photos_storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-photos' AND owner = auth.uid());