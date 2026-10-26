ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_remote boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN jobs.is_remote IS 'When true, the job can be done remotely and no physical location is required.';
