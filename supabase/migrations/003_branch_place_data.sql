ALTER TABLE branches ADD COLUMN IF NOT EXISTS opening_hours jsonb;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS google_maps_url text;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS google_rating numeric;
