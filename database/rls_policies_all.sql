-- JCACI: RLS policies for all core tables
-- Pattern: authenticated users can SELECT; only Admins can INSERT/UPDATE/DELETE
-- Assumes public.users(id, role) maps auth.uid() -> users.id and has role in ('Admin','Teacher','Staff')

-- Helper: current_role() resolves role from users table using auth.uid()
create or replace function public.current_role()
returns text
language sql
security definer
as $$
  select role from public.users where id = auth.uid();
$$;

-- Utility: create policy if not exists (by name and table)
-- Usage: select public._create_policy_if_absent('policy_name','schema','table','policy_sql');
create or replace function public._create_policy_if_absent(
  p_name text,
  p_schema text,
  p_table text,
  p_sql text
) returns void as $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = p_name
      and schemaname = p_schema
      and tablename = p_table
  ) then
    execute p_sql;
  end if;
end;
$$ language plpgsql security definer;

-- Enable RLS on all relevant tables (safe if already enabled)
alter table if exists public.grade_sections enable row level security;
alter table if exists public.section_subjects enable row level security;
alter table if exists public.staff enable row level security;
alter table if exists public.students enable row level security;
alter table if exists public.attendance enable row level security;
alter table if exists public.grades enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.app_settings enable row level security;
alter table if exists public.classes enable row level security;

-- Grade Sections
select public._create_policy_if_absent(
  'grade_sections_select_auth','public','grade_sections',
  $$create policy grade_sections_select_auth on public.grade_sections for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'grade_sections_admin_all','public','grade_sections',
  $$create policy grade_sections_admin_all on public.grade_sections for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Section Subjects
select public._create_policy_if_absent(
  'section_subjects_select_auth','public','section_subjects',
  $$create policy section_subjects_select_auth on public.section_subjects for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'section_subjects_admin_all','public','section_subjects',
  $$create policy section_subjects_admin_all on public.section_subjects for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Staff
select public._create_policy_if_absent(
  'staff_select_auth','public','staff',
  $$create policy staff_select_auth on public.staff for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'staff_admin_all','public','staff',
  $$create policy staff_admin_all on public.staff for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Students
select public._create_policy_if_absent(
  'students_select_auth','public','students',
  $$create policy students_select_auth on public.students for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'students_admin_all','public','students',
  $$create policy students_admin_all on public.students for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Attendance
select public._create_policy_if_absent(
  'attendance_select_auth','public','attendance',
  $$create policy attendance_select_auth on public.attendance for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'attendance_admin_all','public','attendance',
  $$create policy attendance_admin_all on public.attendance for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Grades
select public._create_policy_if_absent(
  'grades_select_auth','public','grades',
  $$create policy grades_select_auth on public.grades for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'grades_admin_all','public','grades',
  $$create policy grades_admin_all on public.grades for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Users (sensitive): Admin-only for SELECT and writes
select public._create_policy_if_absent(
  'users_admin_all','public','users',
  $$create policy users_admin_all on public.users for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- App Settings
select public._create_policy_if_absent(
  'app_settings_select_auth','public','app_settings',
  $$create policy app_settings_select_auth on public.app_settings for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'app_settings_admin_all','public','app_settings',
  $$create policy app_settings_admin_all on public.app_settings for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Classes
select public._create_policy_if_absent(
  'classes_select_auth','public','classes',
  $$create policy classes_select_auth on public.classes for select to authenticated using (true)$$
);
select public._create_policy_if_absent(
  'classes_admin_all','public','classes',
  $$create policy classes_admin_all on public.classes for all to authenticated using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin')) with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'Admin'))$$
);

-- Refresh PostgREST schema cache after DDL
select pg_notify('pgrst','reload schema');
