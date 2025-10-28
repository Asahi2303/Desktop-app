-- Create a normalized table `grade_sections` and seed it with default sections
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS public.grade_sections (
  id BIGSERIAL PRIMARY KEY,
  grade SMALLINT NOT NULL,
  section_name TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2024-2025',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grade, section_name, academic_year)
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp_for_grade_sections()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'set_timestamp_on_grade_sections' AND c.relname = 'grade_sections'
  ) THEN
    CREATE TRIGGER set_timestamp_on_grade_sections
    BEFORE UPDATE ON public.grade_sections
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp_for_grade_sections();
  END IF;
END $$;

-- Seed data (idempotent)
INSERT INTO public.grade_sections (grade, section_name, academic_year, updated_at)
VALUES
  (1, 'Sampaguita', '2024-2025', NOW()),
  (1, 'Rose', '2024-2025', NOW()),
  (2, 'Tulip', '2024-2025', NOW()),
  (2, 'Sunflower', '2024-2025', NOW()),
  (3, 'Jasmin', '2024-2025', NOW()),
  (4, 'Gumamela', '2024-2025', NOW()),
  (5, 'Rosal', '2024-2025', NOW()),
  (6, 'Santan', '2024-2025', NOW()),
  (7, 'Rizal', '2024-2025', NOW()),
  (8, 'Bonifacio', '2024-2025', NOW()),
  (9, 'Mabini', '2024-2025', NOW()),
  (10, 'Del Pilar', '2024-2025', NOW())
ON CONFLICT (grade, section_name, academic_year) DO UPDATE
  SET updated_at = EXCLUDED.updated_at;

-- Optional: grant select to authenticated (adjust as needed for your RLS)
-- GRANT SELECT ON public.grade_sections TO authenticated;
