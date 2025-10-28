-- Supabase RLS Policy Templates for JCACI
-- These templates tighten access so only Admins can read/write everything,
-- while Teachers/Staff can only access the records they are assigned to.

-- Assumptions:
-- 1) auth.users.id is mapped to app users.id
-- 2) public.users table contains role field with values: 'Admin' | 'Teacher' | 'Staff'
-- 3) public.classes table (aka 'classes') maps teacher_id to users.id
-- 4) students have grade/section assignments referenced by classes

-- Helper: Create a security definer function to get role
create or replace function public.current_role()
returns text
language sql
security definer
as $$
  select role from public.users where id = auth.uid();
$$;

-- Students: Admin full, Teachers/Staff read-only and only for their classes (example association via classes_students)
alter table public.students enable row level security;

-- Read policy for Admin
create policy students_admin_all on public.students
for all
to authenticated
using (
  public.current_role() = 'Admin'
)
with check (
  public.current_role() = 'Admin'
);

-- Read-only policy for Teachers/Staff limited by membership in classes_students
-- Requires a join table public.classes_students(student_id, class_id) and classes.teacher_id
create policy students_teacher_staff_read on public.students
for select
to authenticated
using (
  public.current_role() in ('Teacher','Staff')
  and exists (
    select 1 from public.classes_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = students.id
      and c.teacher_id = auth.uid()
  )
);

-- Attendance: Admin full access; Teachers can manage for their classes
alter table public.attendance enable row level security;

create policy attendance_admin_all on public.attendance
for all to authenticated
using (public.current_role() = 'Admin')
with check (public.current_role() = 'Admin');

create policy attendance_teacher_manage on public.attendance
for select using (
  public.current_role() in ('Teacher','Staff')
  and exists (
    select 1 from public.classes_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = attendance.student_id
      and c.teacher_id = auth.uid()
  )
);

create policy attendance_teacher_insert on public.attendance
for insert with check (
  public.current_role() in ('Teacher','Staff')
  and exists (
    select 1 from public.classes_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = attendance.student_id
      and c.teacher_id = auth.uid()
  )
);

-- Grades: similar to attendance
alter table public.grades enable row level security;

create policy grades_admin_all on public.grades
for all to authenticated
using (public.current_role() = 'Admin')
with check (public.current_role() = 'Admin');

create policy grades_teacher_manage on public.grades
for select using (
  public.current_role() in ('Teacher','Staff')
  and exists (
    select 1 from public.classes_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = grades.student_id
      and c.teacher_id = auth.uid()
  )
);

create policy grades_teacher_insert on public.grades
for insert with check (
  public.current_role() in ('Teacher','Staff')
  and exists (
    select 1 from public.classes_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = grades.student_id
      and c.teacher_id = auth.uid()
  )
);

-- Billing: Admin only
alter table public.billing enable row level security;
create policy billing_admin_all on public.billing
for all to authenticated
using (public.current_role() = 'Admin')
with check (public.current_role() = 'Admin');

-- Users: Admin only
alter table public.users enable row level security;
create policy users_admin_all on public.users
for all to authenticated
using (public.current_role() = 'Admin')
with check (public.current_role() = 'Admin');

-- App Settings: Admin only
alter table public.app_settings enable row level security;
create policy app_settings_admin_all on public.app_settings
for all to authenticated
using (public.current_role() = 'Admin')
with check (public.current_role() = 'Admin');

-- Classes: Admin full; Teachers can read their own classes
alter table public.classes enable row level security;
create policy classes_admin_all on public.classes
for all to authenticated
using (public.current_role() = 'Admin')
with check (public.current_role() = 'Admin');

create policy classes_teacher_read on public.classes
for select to authenticated
using (
  public.current_role() in ('Teacher','Staff') and teacher_id = auth.uid()
);
