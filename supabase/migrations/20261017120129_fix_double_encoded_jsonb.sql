/*
# Fix double-encoded JSONB data in profiles

The seed edge function used JSON.stringify() when writing JSONB columns,
causing values to be stored as string-encoded JSON inside jsonb fields
(e.g. qualifications_summary was '"[{...}]"' instead of '[{...}]').

This migration parses the string values back into proper jsonb.
*/

UPDATE profiles
SET qualifications_summary = CASE
  WHEN pg_typeof(qualifications_summary)::text = 'jsonb'
    AND jsonb_typeof(qualifications_summary) = 'string'
  THEN qualifications_summary::text::jsonb
  ELSE qualifications_summary
END;

UPDATE profiles
SET service_areas = CASE
  WHEN jsonb_typeof(service_areas) = 'string'
  THEN service_areas::text::jsonb
  ELSE service_areas
END;

UPDATE profiles
SET availability = CASE
  WHEN jsonb_typeof(availability) = 'string'
  THEN availability::text::jsonb
  ELSE availability
END;
