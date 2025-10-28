-- Mobile-friendly read-only views and realtime enablement

-- View: public.mobile_grades
-- Denormalized for simple mobile consumption
CREATE OR REPLACE VIEW public.mobile_grades AS
SELECT
  g.id AS grade_id,
  g.student_id,
  s.first_name AS student_first_name,
  s.last_name AS student_last_name,
  s.grade AS student_grade_level,
  s.section AS student_section,
  g.subject,
  g.grade AS percentage,
  g.max_grade,
  CASE
    WHEN g.grade >= 90 THEN 'A'
    WHEN g.grade >= 80 THEN 'B'
    WHEN g.grade >= 70 THEN 'C'
    WHEN g.grade >= 60 THEN 'D'
    ELSE 'F'
  END AS letter_grade,
  g.semester,
  g.academic_year,
  COALESCE(g.notes, 'Assignment') AS assignment,
  g.created_at,
  g.updated_at
FROM public.grades g
JOIN public.students s ON s.id = g.student_id;

-- Optional grants (RLS on base tables still applies)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT ON public.mobile_grades TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT SELECT ON public.mobile_grades TO anon;
  END IF;
END$$;

-- Ensure grades table is in the realtime publication so mobile can subscribe to inserts/updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'grades'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.grades';
    END IF;
  END IF;
END$$;
