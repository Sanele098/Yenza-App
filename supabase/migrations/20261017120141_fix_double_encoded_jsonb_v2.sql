/*
# Fix double-encoded JSONB data in profiles (retry)

The previous attempt didn't properly parse the string-typed jsonb values.
Using (column::text)::jsonb to re-parse the string content into proper jsonb.
*/

UPDATE profiles
SET qualifications_summary = (qualifications_summary::text)::jsonb
WHERE jsonb_typeof(qualifications_summary) = 'string';

UPDATE profiles
SET service_areas = (service_areas::text)::jsonb
WHERE jsonb_typeof(service_areas) = 'string';

UPDATE profiles
SET availability = (availability::text)::jsonb
WHERE jsonb_typeof(availability) = 'string';
