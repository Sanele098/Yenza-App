/*
# Fix: set search_path on update_updated_at function

The database linter flagged the update_updated_at trigger function for having
a mutable search_path, which is a security risk. This migration drops the
triggers, recreates the function with an explicit search_path, then recreates
the triggers.
*/

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS trigger_worker_credentials_updated_at ON worker_credentials;

DROP FUNCTION IF EXISTS update_updated_at();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_worker_credentials_updated_at BEFORE UPDATE ON worker_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
