INSERT INTO services (name, category, slug, active) VALUES
  ('Digital', 'General Work', 'digital', true),
  ('Remote', 'General Work', 'remote', true),
  ('Other', 'General Work', 'other', true)
ON CONFLICT (slug) DO NOTHING;