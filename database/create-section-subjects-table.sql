-- Create section_subjects table linked to grade_sections for subject assignment and scheduling
-- Idempotent and safe to re-run

CREATE TABLE IF NOT EXISTS public.section_subjects (
  id BIGSERIAL PRIMARY KEY,
  section_id BIGINT NOT NULL REFERENCES public.grade_sections(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  staff_id BIGINT NULL REFERENCES public.staff(id) ON DELETE SET NULL,
  schedule JSONB NULL, -- {"days":[1,3,5],"start":"08:00","end":"09:00","room":"101"}
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT section_subject_unique UNIQUE (section_id, subject)
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp_for_section_subjects()
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
    WHERE t.tgname = 'set_timestamp_on_section_subjects' AND c.relname = 'section_subjects'
  ) THEN
    CREATE TRIGGER set_timestamp_on_section_subjects
    BEFORE UPDATE ON public.section_subjects
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp_for_section_subjects();
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_section_subjects_section_id ON public.section_subjects(section_id);
CREATE INDEX IF NOT EXISTS idx_section_subjects_staff_id ON public.section_subjects(staff_id);

-- Idempotent alter to add staff_id if table existed previously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'section_subjects'
      AND column_name = 'staff_id'
  ) THEN
    ALTER TABLE public.section_subjects
    ADD COLUMN staff_id BIGINT NULL REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Idempotent drop of legacy teacher_id column and its index to avoid UUID casting errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'section_subjects'
      AND column_name = 'teacher_id'
  ) THEN
    -- Drop index if present first (safe even if it doesn't exist)
    BEGIN
      EXECUTE 'DROP INDEX IF EXISTS public.idx_section_subjects_teacher_id';
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
    -- Drop the column
    ALTER TABLE public.section_subjects DROP COLUMN teacher_id;
  END IF;
END $$;
