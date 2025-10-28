## JCACI database schema for mobile app

This document describes the current database schema used by the desktop app, with mobile-friendly notes, relationships, and ready‑to‑paste SQL (tables, views, and policies) so a mobile app can read the data reliably.

If you need a minimal subset, use only the tables and views marked as Core for Mobile.

### Conventions

- Timestamps use timestamptz.
- UUIDs map to auth.users.id in Supabase.
- Staff and students use integer IDs (serial/bigserial).
- RLS: reads are allowed for authenticated users; writes are Admin-only (see snippet).

---

## Tables

### 1) public.users
- id: uuid primary key, references auth.users(id)
- email: text unique not null
- name: text
- role: text check in ('Admin','Teacher','Staff') default 'Teacher'
- avatar_url: text
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Purpose: role mapping for auth.uid() -> application roles.

Indexes/constraints:
- pk_users (id)
- unique(email)

RLS: Admin-only read and write recommended.

---

### 2) public.staff (Core for Mobile)
- id: serial primary key (integer)
- first_name: text not null
- last_name: text not null
- email: text unique not null
- role: text not null
- department: text not null (e.g., 'Academics')
- phone: text
- hire_date: date not null
- status: text check in ('Active','Inactive','On Leave') default 'Active'
- avatar_url: text
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Notes:
- Teachers are modeled as staff with department='Academics' and status='Active'.

Indexes/constraints:
- pk_staff (id)
- unique(email)

---

### 3) public.students (Core for Mobile)
- id: serial primary key (integer)
- first_name: text not null
- last_name: text not null
- email: text unique not null
- grade: text not null
- section: text not null
- status: text check in ('Active','Inactive','Graduated') default 'Active'
- enrollment_date: date not null
- avatar_url: text
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Notes:
- Legacy fields grade/section are text on students. The new section model uses grade_sections + section_subjects for structure.

Indexes/constraints:
- pk_students (id)
- unique(email)

---

### 4) public.grade_sections (Core for Mobile)
- id: bigserial primary key
- grade: integer not null
- section_name: text not null
- academic_year: text not null
- notes: text null
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Constraints:
- unique (grade, section_name, academic_year)

Indexes:
- idx_grade_sections_grade (grade)

---

### 5) public.section_subjects (Core for Mobile)
- id: bigserial primary key
- section_id: bigint not null references public.grade_sections(id) on delete cascade
- subject: text not null
- staff_id: bigint null references public.staff(id) on delete set null
- schedule: jsonb null  // {"days":[1,3,5],"start":"08:00","end":"09:00","room":"101"}
- notes: text null
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Constraints:
- unique (section_id, subject)

Indexes:
- idx_section_subjects_section_id (section_id)
- idx_section_subjects_staff_id (staff_id)

Important:
- Ensure staff_id is BIGINT (not UUID). See Fix section below.

---

### 6) public.attendance (Core for Mobile)
- id: serial primary key
- student_id: integer references public.students(id) on delete cascade
- date: date not null
- status: text check in ('Present','Absent','Late','Excused') not null
- notes: text
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Constraints:
- unique (student_id, date)

Indexes:
- idx_attendance_student_date (student_id, date)

---

### 7) public.grades (Core for Mobile)
- id: serial primary key
- student_id: integer references public.students(id) on delete cascade
- subject: text not null
- grade: decimal(5,2) not null
- max_grade: decimal(5,2) not null default 100
- semester: text not null
- academic_year: text not null
- notes: text
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Indexes:
- idx_grades_student (student_id)

---

### 8) public.app_settings
- id: serial primary key
- key: text unique not null
- value: jsonb not null
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

---

### 9) public.classes (optional; not required by mobile)
- id: serial primary key
- name: text not null
- subject: text not null
- teacher_id: uuid references public.users(id)
- room: text
- day_of_week: integer (0=Sun .. 6=Sat)
- start_time: text (HH:MM)
- end_time: text (HH:MM)
- academic_year: text not null
- created_at: timestamptz default now()
- updated_at: timestamptz default now()

Note: Desktop app falls back if this table is missing. Mobile can ignore it if using section_subjects.schedule.

---

## Relationships

- grade_sections 1—N section_subjects
- staff 1—N section_subjects (via staff_id, nullable)
- students 1—N attendance
- students 1—N grades
- users (uuid) is an auth mapping table with role—used by RLS

---

## Views for mobile (read-only)

These views simplify common mobile queries and are safe under read-only RLS.

```sql
-- Teachers list (active academics)
create or replace view public.v_staff_teachers as
select s.id as staff_id,
       s.first_name,
       s.last_name,
       s.email,
       s.department,
       s.status
from public.staff s
where s.department = 'Academics' and s.status = 'Active';

-- Sections with per-subject assignment and schedule
create or replace view public.v_sections_subjects as
select ss.id as section_subject_id,
       gs.id as section_id,
       gs.grade,
       gs.section_name,
       gs.academic_year,
       ss.subject,
       ss.staff_id,
       (s.first_name || ' ' || s.last_name) as teacher_name,
       ss.schedule,
       ss.created_at,
       ss.updated_at
from public.section_subjects ss
join public.grade_sections gs on gs.id = ss.section_id
left join public.staff s on s.id = ss.staff_id;

-- Students basic list (can be filtered by grade/section)
create or replace view public.v_students_basic as
select id as student_id,
       first_name,
       last_name,
       email,
       grade,
       section,
       status
from public.students;
```

Grant reads (optional if your RLS already allows it):
```sql
grant select on public.v_staff_teachers, public.v_sections_subjects, public.v_students_basic to anon, authenticated;
```

---

## RLS summary for mobile

Recommended at minimum:
- SELECT permitted for authenticated (or public) on: staff, students, attendance, grades, grade_sections, section_subjects, app_settings (+ the views above).
- INSERT/UPDATE/DELETE restricted to Admins only.

If you’re using the provided policies, this is already covered by:
- {table}_select_auth (for select)
- {table}_admin_all (single FOR ALL policy for writes, Admins only)

For purely public read (including anon) on views, use the GRANT shown above or a SELECT policy to public.

---

## Sample queries for mobile

Get all sections and their subjects for a school year:
```sql
select * from public.v_sections_subjects
where academic_year = '2024-2025'
order by grade, section_name, subject;
```

Get teachers (active academics):
```sql
select * from public.v_staff_teachers order by last_name, first_name;
```

Get students in a grade/section:
```sql
select * from public.v_students_basic
where grade = '5' and section = 'A'
order by last_name, first_name;
``;

Get attendance for a student within a date range:
```sql
select * from public.attendance
where student_id = 123 and date between '2025-06-01' and '2025-06-30'
order by date desc;
```

---

## Fix/verify staff_id type (section_subjects)

Use this once if you see UUID casting errors when saving subjects from Admin UI (e.g., "invalid input syntax for type uuid: '14'"):

```sql
-- Ensure staff_id is BIGINT and FK to staff(id)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'section_subjects'
      and column_name  = 'staff_id'
      and data_type   <> 'bigint'
  ) then
    begin
      execute 'drop index if exists public.idx_section_subjects_staff_id';
    exception when others then
    end;
    alter table public.section_subjects drop constraint if exists section_subjects_staff_id_fkey;
    alter table public.section_subjects
      alter column staff_id type bigint
      using (case when staff_id::text ~ '^[0-9]+' then (staff_id::text)::bigint else null end);
    alter table public.section_subjects
      add constraint section_subjects_staff_id_fkey foreign key (staff_id) references public.staff(id) on delete set null;
    create index if not exists idx_section_subjects_staff_id on public.section_subjects(staff_id);
  end if;
end $$;

-- Optional: drop legacy teacher_id if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'section_subjects' and column_name = 'teacher_id'
  ) then
    begin execute 'drop index if exists public.idx_section_subjects_teacher_id'; exception when others then end;
    alter table public.section_subjects drop column teacher_id;
  end if;
end $$;

-- Refresh schema cache
select pg_notify('pgrst','reload schema');
```

---

## Data dictionary (quick reference)

- users: (id uuid, email, name, role, avatar_url, created_at, updated_at)
- staff: (id int, first_name, last_name, email, role, department, phone, hire_date, status, avatar_url, created_at, updated_at)
- students: (id int, first_name, last_name, email, grade text, section text, status, enrollment_date, avatar_url, created_at, updated_at)
- grade_sections: (id bigserial, grade int, section_name text, academic_year text, notes, created_at, updated_at)
- section_subjects: (id bigserial, section_id bigint FK grade_sections, subject text, staff_id bigint FK staff, schedule jsonb, notes, created_at, updated_at)
- attendance: (id int, student_id int FK students, date, status, notes, created_at, updated_at)
- grades: (id int, student_id int FK students, subject, grade numeric, max_grade numeric, semester, academic_year, notes, created_at, updated_at)
- app_settings: (id int, key text unique, value jsonb, created_at, updated_at)
- classes (optional): (id int, name, subject, teacher_id uuid FK users, room, day_of_week, start_time, end_time, academic_year, created_at, updated_at)

---

## Notes

- The desktop app reads teachers from staff where department='Academics' and status='Active'.
- The Admin UI assigns staff to subjects via section_subjects.staff_id.
- Schedules are stored inside section_subjects.schedule as JSON.
- Billing table exists historically in some environments but is unused by the current app.
