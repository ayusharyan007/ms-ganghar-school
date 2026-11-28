alter table public.school_profile
  add column if not exists principal_name text,
  add column if not exists teacher_names text;