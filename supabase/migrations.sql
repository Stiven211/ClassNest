-- Habilitar la extensión para UUID
create extension if not exists "uuid-ossp";

-- Trigger para crear usuario automáticamente al registrarse
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, grades, subject)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    array(
      select jsonb_array_elements_text(
        case
          when jsonb_typeof(coalesce(new.raw_user_meta_data->'grades', '[]'::jsonb)) = 'array'
          then coalesce(new.raw_user_meta_data->'grades', '[]'::jsonb)
          else '[]'::jsonb
        end
      )
    ),
    coalesce(new.raw_user_meta_data->>'subject', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    grades = excluded.grades,
    subject = excluded.subject;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabla users
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  grades text[],
  subject text,
  created_at timestamp default now()
);

-- Tabla classes
create table classes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  name text not null,
  subject text not null,
  grade text,
  color text,
  created_at timestamp default now()
);

-- Tabla students
create table students (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  class_id uuid references classes not null,
  name text not null,
  "lastName" text not null,
  created_at timestamp default now()
);

-- Tabla activities (debe crearse antes que grades por la FK)
create table activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  class_id uuid references classes not null,
  name text not null,
  type text not null,
  date date,
  max_score numeric,
  created_at timestamp default now()
);

-- Tabla attendance
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  class_id uuid references classes not null,
  student_id uuid references students not null,
  date date not null,
  status text check (status in ('presente', 'ausente', 'ausencia_justificada', 'retraso_justificado', 'retirado')),
  comment text,
  created_at timestamp default now()
);

-- Tabla grades (después de activities)
create table grades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  activity_id uuid references activities not null,
  student_id uuid references students not null,
  score numeric not null,
  comment text,
  created_at timestamp default now(),
  constraint grades_activity_student_unique unique (user_id, activity_id, student_id)
);

-- Tabla diary_entries
create table diary_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  class_id uuid references classes not null,
  date date not null,
  title text not null,
  content text,
  created_at timestamp default now()
);

-- Tabla schedule_blocks
create table schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  class_id uuid references classes not null,
  day integer not null check (day >= 0 and day <= 4),
  start_hour numeric not null,
  end_hour numeric not null,
  room text,
  created_at timestamp default now()
);

-- Índices para mejor rendimiento
create index idx_classes_user_id on classes(user_id);
create index idx_students_user_id on students(user_id);
create index idx_students_class_id on students(class_id);
create index idx_attendance_user_id on attendance(user_id);
create index idx_attendance_class_id on attendance(class_id);
create index idx_attendance_student_id on attendance(student_id);
create index idx_grades_user_id on grades(user_id);
create index idx_grades_activity_id on grades(activity_id);
create index idx_grades_student_id on grades(student_id);
create index idx_schedule_blocks_user_id on schedule_blocks(user_id);
create index idx_diary_entries_user_id on diary_entries(user_id);
create index idx_activities_user_id on activities(user_id);

-- Políticas RLS (Row Level Security)
alter table classes enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table grades enable row level security;
alter table schedule_blocks enable row level security;
alter table diary_entries enable row level security;
alter table activities enable row level security;

create policy "Users can view their own classes" on classes for select using (auth.uid() = user_id);
create policy "Users can insert their own classes" on classes for insert with check (auth.uid() = user_id);
create policy "Users can update their own classes" on classes for update using (auth.uid() = user_id);
create policy "Users can delete their own classes" on classes for delete using (auth.uid() = user_id);

create policy "Users can view their own students" on students for select using (auth.uid() = user_id);
create policy "Users can insert their own students" on students for insert with check (auth.uid() = user_id);
create policy "Users can update their own students" on students for update using (auth.uid() = user_id);
create policy "Users can delete their own students" on students for delete using (auth.uid() = user_id);

create policy "Users can view their own attendance" on attendance for select using (auth.uid() = user_id);
create policy "Users can insert their own attendance" on attendance for insert with check (auth.uid() = user_id);
create policy "Users can update their own attendance" on attendance for update using (auth.uid() = user_id);
create policy "Users can delete their own attendance" on attendance for delete using (auth.uid() = user_id);

create policy "Users can view their own grades" on grades for select using (auth.uid() = user_id);
create policy "Users can insert their own grades" on grades for insert with check (auth.uid() = user_id);
create policy "Users can update their own grades" on grades for update using (auth.uid() = user_id);
create policy "Users can delete their own grades" on grades for delete using (auth.uid() = user_id);

create policy "Users can view their own schedule_blocks" on schedule_blocks for select using (auth.uid() = user_id);
create policy "Users can insert their own schedule_blocks" on schedule_blocks for insert with check (auth.uid() = user_id);
create policy "Users can update their own schedule_blocks" on schedule_blocks for update using (auth.uid() = user_id);
create policy "Users can delete their own schedule_blocks" on schedule_blocks for delete using (auth.uid() = user_id);

create policy "Users can view their own diary_entries" on diary_entries for select using (auth.uid() = user_id);
create policy "Users can insert their own diary_entries" on diary_entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own diary_entries" on diary_entries for update using (auth.uid() = user_id);
create policy "Users can delete their own diary_entries" on diary_entries for delete using (auth.uid() = user_id);

create policy "Users can view their own activities" on activities for select using (auth.uid() = user_id);
create policy "Users can insert their own activities" on activities for insert with check (auth.uid() = user_id);
create policy "Users can update their own activities" on activities for update using (auth.uid() = user_id);
create policy "Users can delete their own activities" on activities for delete using (auth.uid() = user_id);

-- Tabla periods para periodos académicos
create table if not exists periods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users not null,
  class_id uuid references classes not null,
  period_number integer not null check (period_number between 1 and 4),
  name text not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  is_closed boolean default false,
  closed_at timestamptz,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  constraint periods_user_class_number_unique unique (user_id, class_id, period_number)
);

alter table activities add column if not exists period_id uuid references periods(id) on delete set null;

create index if not exists idx_periods_user_id on periods(user_id);
create index if not exists idx_periods_class_id on periods(class_id);
create index if not exists idx_periods_user_class on periods(user_id, class_id, period_number);
create index if not exists idx_activities_period_id on activities(period_id);

alter table periods enable row level security;

create policy "Users can view their own periods" on periods for select using (auth.uid() = user_id);
create policy "Users can insert their own periods" on periods for insert with check (auth.uid() = user_id);
create policy "Users can update their own periods" on periods for update using (auth.uid() = user_id);
create policy "Users can delete their own periods" on periods for delete using (auth.uid() = user_id);

create or replace function public.check_period_overlap()
returns trigger as $$
declare
  overlapping_count integer;
begin
  select count(*) into overlapping_count
  from public.periods
  where id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and user_id = new.user_id
    and class_id = new.class_id
    and new.start_date <= end_date
    and new.end_date >= start_date;

  if overlapping_count > 0 then
    raise exception 'Las fechas del periodo se cruzan con otro periodo de la misma clase';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_periods_no_overlap on periods;

create trigger trg_periods_no_overlap
  before insert or update of start_date, end_date, user_id, class_id
  on periods
  for each row
  execute function public.check_period_overlap();

-- Tabla app_updates para gestión de actualizaciones APK
create table if not exists app_updates (
  id uuid primary key default uuid_generate_v4(),
  version text not null,
  build integer not null,
  apk_url text not null,
  changelog text,
  mandatory boolean default false,
  created_at timestamp default now()
);

create index if not exists idx_app_updates_version on app_updates(version desc);
create index if not exists idx_app_updates_build on app_updates(build desc);
create index if not exists idx_app_updates_created_at on app_updates(created_at desc);

alter table app_updates enable row level security;

create policy "Anyone can view app updates" on app_updates for select using (true);
create policy "Admin can insert app updates" on app_updates for insert with check (auth.uid() = (select id from users where email like '%admin%' escape '$'));
create policy "Admin can update app updates" on app_updates for update using (auth.uid() = (select id from users where email like '%admin%' escape '$'));
create policy "Admin can delete app updates" on app_updates for delete using (auth.uid() = (select id from users where email like '%admin%' escape '$'));

-- Insertar registro inicial para la versión 1.1.0 (build 2)
-- Actualizar la URL de apk_url al hosting que uses (Supabase Storage, GitHub Releases, etc.)
insert into app_updates (version, build, apk_url, changelog, mandatory)
values (
  '1.1.0',
  2,
  'https://rmecpcrfcpxkzbjrfjos.supabase.co/storage/v1/object/public/classnest-apks/ClassNest.apk',
  'Nueva version con sistema de actualizaciones mejorado.',
  false
);
