-- Add optional suffix to students table for name suffixes like Jr., Sr., II, III
-- Safe to run multiple times
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS suffix text;

COMMENT ON COLUMN public.students.suffix IS 'Optional name suffix: Jr., Sr., II, III, etc.';
