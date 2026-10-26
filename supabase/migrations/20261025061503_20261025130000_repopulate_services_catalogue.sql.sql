-- Re-populate the service catalogue so workers/employers can use the app.
-- Matches the full list the frontend expects (mockData.ts ALL_GENERAL_SERVICES + ALL_SKILLED_SERVICES + Digital/Remote/Other).

INSERT INTO services (name, category, slug, active) VALUES
  -- General Work
  ('Cleaning',           'General Work',    'cleaning',           true),
  ('Gardening',          'General Work',    'gardening',          true),
  ('Moving Assistance',  'General Work',    'moving-assistance',  true),
  ('Painting',           'General Work',    'painting',           true),
  ('Car Washing',        'General Work',    'car-washing',        true),
  ('Event Assistance',   'General Work',    'event-assistance',   true),
  ('General Labour',     'General Work',    'general-labour',     true),
  ('Digital',            'General Work',    'digital',            true),
  ('Remote',             'General Work',    'remote',             true),
  ('Other',              'General Work',    'other',              true),
  -- Skilled Services
  ('Plumbing',           'Skilled Services','plumbing',           true),
  ('Electrical',         'Skilled Services','electrical',         true),
  ('Carpentry',          'Skilled Services','carpentry',          true),
  ('Welding',            'Skilled Services','welding',            true),
  ('Tiling',             'Skilled Services','tiling',             true),
  ('Mechanics',          'Skilled Services','mechanics',          true),
  ('Solar Installation', 'Skilled Services','solar-installation', true)
ON CONFLICT (name) DO NOTHING;
