-- Recreate the view to allow column layout changes (adds legacy alias column "name")
DROP VIEW IF EXISTS public.sections;

CREATE VIEW public.sections AS
SELECT
  gs.id,
  gs.section_name AS name, -- legacy alias
  gs.grade,
  gs.section_name,
  gs.academic_year,
  gs.notes,
  gs.created_at,
  gs.updated_at
FROM public.grade_sections gs;

-- Note: This view is read-only. Writes should target `public.grade_sections`.
