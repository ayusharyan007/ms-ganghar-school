-- Apply this follow-up migration if the initial schema was installed before
-- explicit Data API grants were included. RLS policies remain in force.
grant usage on schema public to anon, authenticated;

grant select on public.school_profile, public.event_categories,
  public.gallery_images, public.videos, public.important_updates,
  public.downloadable_documents to anon;

grant select on public.admin_profiles, public.school_profile,
  public.event_categories, public.gallery_images, public.videos,
  public.important_updates, public.downloadable_documents,
  public.admin_activity_logs to authenticated;

grant insert, update, delete on public.school_profile,
  public.event_categories, public.gallery_images, public.videos,
  public.important_updates, public.downloadable_documents to authenticated;
