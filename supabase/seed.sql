-- Optional initial public profile. Sign in to replace generic values before launch.
insert into public.school_profile (school_name, welcome_message, published)
select 'Government Senior Secondary School',
       'Rooted in our community. Committed to every child. Together, we make learning meaningful.',
       true
where not exists (select 1 from public.school_profile);
