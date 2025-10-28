-- Seed default grade -> sections mapping into app_settings
-- This is idempotent and will upsert the key 'grade_sections'

INSERT INTO app_settings (key, value, updated_at)
VALUES (
  'grade_sections',
  '{
    "1": ["Sampaguita", "Rose"],
    "2": ["Tulip", "Sunflower"],
    "3": ["Jasmin"],
    "4": ["Gumamela"],
    "5": ["Rosal"],
    "6": ["Santan"],
    "7": ["Rizal"],
    "8": ["Bonifacio"],
    "9": ["Mabini"],
    "10": ["Del Pilar"]
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;
