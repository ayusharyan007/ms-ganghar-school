-- Initial schema for a public school information site.
-- Run in the Supabase SQL editor. Never add the service role key to frontend code.
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_school_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admin_profiles p where p.user_id = (select auth.uid())) $$;
revoke all on function public.is_school_admin() from public;
grant execute on function public.is_school_admin() to anon, authenticated;

create table if not exists public.school_profile (
  id uuid primary key default gen_random_uuid(),
  school_name text not null default 'Government Senior Secondary School',
  logo_url text,
  logo_storage_path text,
  hero_image_url text,
  hero_storage_path text,
  welcome_message text,
  history text,
  mission text,
  vision text,
  principal_message text,
  address text,
  phone text,
  email text,
  map_embed_url text,
  establishment_year integer,
  student_count integer,
  teacher_count integer,
  facilities text[] not null default '{}',
  achievements text[] not null default '{}',
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists school_profile_singleton_idx on public.school_profile ((true));

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  storage_path text,
  event_name text,
  category_id uuid references public.event_categories(id) on delete set null,
  month smallint check (month between 1 and 12),
  year smallint check (year between 1900 and 2200),
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_url text not null,
  thumbnail_url text,
  storage_path text,
  event_name text,
  category_id uuid references public.event_categories(id) on delete set null,
  month smallint check (month between 1 and 12),
  year smallint check (year between 1900 and 2200),
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.important_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'General Notice',
  published_at timestamptz,
  expires_at date,
  is_pinned boolean not null default false,
  attachment_url text,
  attachment_storage_path text,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.downloadable_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  storage_path text,
  file_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  category text not null default 'Other Documents',
  month smallint check (month between 1 and 12),
  year smallint check (year between 1900 and 2200),
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  table_name text not null,
  record_id uuid,
  summary jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists gallery_published_date_idx on public.gallery_images (published, year desc, month desc, created_at desc);
create index if not exists videos_published_date_idx on public.videos (published, year desc, month desc, created_at desc);
create index if not exists updates_active_date_idx on public.important_updates (published, published_at desc, expires_at);
create index if not exists updates_pinned_idx on public.important_updates (is_pinned desc, published_at desc) where published = true;
create index if not exists documents_published_category_idx on public.downloadable_documents (published, category, year desc, month desc);
create index if not exists activity_recent_idx on public.admin_activity_logs (created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create or replace function public.log_admin_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_json jsonb; new_json jsonb; row_id uuid;
begin
  if tg_op <> 'INSERT' then old_json := to_jsonb(old); row_id := (old_json->>'id')::uuid; end if;
  if tg_op <> 'DELETE' then new_json := to_jsonb(new); row_id := (new_json->>'id')::uuid; end if;
  insert into public.admin_activity_logs(actor_id, action, table_name, record_id, summary)
  values ((select auth.uid()), tg_op, tg_table_name, row_id,
    case when tg_op = 'DELETE' then jsonb_build_object('title', coalesce(old_json->>'title', old_json->>'school_name'))
    else jsonb_build_object('title', coalesce(new_json->>'title', new_json->>'school_name'), 'published', new_json->'published') end);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['school_profile','gallery_images','videos','important_updates','downloadable_documents'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('drop trigger if exists audit_content_change on public.%I', t);
    execute format('create trigger audit_content_change after insert or update or delete on public.%I for each row execute function public.log_admin_change()', t);
  end loop;
end $$;

alter table public.admin_profiles enable row level security;
alter table public.school_profile enable row level security;
alter table public.event_categories enable row level security;
alter table public.gallery_images enable row level security;
alter table public.videos enable row level security;
alter table public.important_updates enable row level security;
alter table public.downloadable_documents enable row level security;
alter table public.admin_activity_logs enable row level security;

-- Only the signed-in account can see its own admin marker. Provisioning is done
-- from the trusted Supabase SQL editor; no browser policy can grant admin access.
create policy "Read own admin marker" on public.admin_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "Public read school profile" on public.school_profile for select to anon, authenticated using (published or (select public.is_school_admin()));
create policy "Admin insert school profile" on public.school_profile for insert to authenticated with check ((select public.is_school_admin()));
create policy "Admin update school profile" on public.school_profile for update to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()));
create policy "Admin delete school profile" on public.school_profile for delete to authenticated using ((select public.is_school_admin()));

create policy "Public read categories" on public.event_categories for select to anon, authenticated using (true);
create policy "Admin manage categories" on public.event_categories for all to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()));

create policy "Public read published gallery" on public.gallery_images for select to anon, authenticated using (published or (select public.is_school_admin()));
create policy "Admin manage gallery" on public.gallery_images for all to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()));
create policy "Public read published videos" on public.videos for select to anon, authenticated using (published or (select public.is_school_admin()));
create policy "Admin manage videos" on public.videos for all to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()));
create policy "Public read active updates" on public.important_updates for select to anon, authenticated using ((published and (expires_at is null or expires_at >= current_date)) or (select public.is_school_admin()));
create policy "Admin manage updates" on public.important_updates for all to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()));
create policy "Public read published documents" on public.downloadable_documents for select to anon, authenticated using (published or (select public.is_school_admin()));
create policy "Admin manage documents" on public.downloadable_documents for all to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()));
create policy "Admins read activity logs" on public.admin_activity_logs for select to authenticated using ((select public.is_school_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('school-assets','school-assets',false,8388608,array['image/jpeg','image/png','image/webp']),
 ('gallery','gallery',false,8388608,array['image/jpeg','image/png','image/webp']),
 ('documents','documents',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
 ('video-thumbnails','video-thumbnails',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Private buckets. The public client can mint a short-lived signed URL only
-- when the file is attached to content that is currently public.
create policy "Read published school media" on storage.objects for select to anon, authenticated using (
  (select public.is_school_admin()) or
  (bucket_id = 'gallery' and exists (select 1 from public.gallery_images g where g.storage_path = name and g.published)) or
  (bucket_id = 'video-thumbnails' and exists (select 1 from public.videos v where v.storage_path = name and v.published)) or
  (bucket_id = 'documents' and (
    exists (select 1 from public.downloadable_documents d where d.storage_path = name and d.published) or
    exists (select 1 from public.important_updates u where u.attachment_storage_path = name and u.published and (u.expires_at is null or u.expires_at >= current_date))
  )) or
  (bucket_id = 'school-assets' and exists (select 1 from public.school_profile s where s.published and (s.logo_storage_path = name or s.hero_storage_path = name)))
);
create policy "Admin upload school media" on storage.objects for insert to authenticated with check (bucket_id in ('school-assets','gallery','documents','video-thumbnails') and (select public.is_school_admin()));
create policy "Admin update school media" on storage.objects for update to authenticated using (bucket_id in ('school-assets','gallery','documents','video-thumbnails') and (select public.is_school_admin())) with check (bucket_id in ('school-assets','gallery','documents','video-thumbnails') and (select public.is_school_admin()));
create policy "Admin delete school media" on storage.objects for delete to authenticated using (bucket_id in ('school-assets','gallery','documents','video-thumbnails') and (select public.is_school_admin()));

insert into public.event_categories(name) values ('School Events'),('Academic Activities'),('Sports'),('Celebrations'),('Facilities') on conflict (name) do nothing;

-- New Supabase projects may not grant Data API privileges to SQL-created
-- public tables by default. Grants expose tables to API roles; RLS above
-- remains the row-level security boundary for every operation.
grant usage on schema public to anon, authenticated;
grant select on public.school_profile, public.event_categories, public.gallery_images,
  public.videos, public.important_updates, public.downloadable_documents to anon;
grant select on public.admin_profiles, public.school_profile, public.event_categories,
  public.gallery_images, public.videos, public.important_updates,
  public.downloadable_documents, public.admin_activity_logs to authenticated;
grant insert, update, delete on public.school_profile, public.event_categories,
  public.gallery_images, public.videos, public.important_updates,
  public.downloadable_documents to authenticated;
