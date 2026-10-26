/*
# Fix triple-encoded JSONB data in profiles

The JSONB values were stored as JSON strings (jsonb_typeof = 'string'),
meaning the actual array/object is wrapped in a JSON string layer.
Using the #>> operator to extract the raw string content, then casting
to jsonb to get the properly typed value.
*/

UPDATE profiles
SET qualifications_summary = (qualifications_summary #>> '{}')::jsonb
WHERE jsonb_typeof(qualifications_summary) = 'string';

UPDATE profiles
SET service_areas = (service_areas #>> '{}')::jsonb
WHERE jsonb_typeof(service_areas) = 'string';

UPDATE profiles
SET availability = (availability #>> '{}')::jsonb
WHERE jsonb_typeof(availability) = 'string';
