# Government School Website

A responsive React and Vite website with public school information pages, a Supabase-powered admin area, PostgreSQL Row Level Security, and private Supabase Storage buckets. Published files are served through short-lived signed URLs. The project contains no custom server. The browser uses the Supabase JavaScript SDK with the publishable/anon key only.

> Replace the generic school name, contact details, imagery and text with verified school information before publishing. Do not upload student personal information or photos without the school’s approval and appropriate consent.

## What is included

- Public Home, Gallery, Videos, Important Updates, Downloads and About pages.
- Responsive layouts, keyboard accessible image lightbox, filters, search fields, lazy loaded images, empty and loading states.
- Supabase Auth email/password login, password reset, persistent sessions and protected admin routes. There is no signup form.
- Admin CRUD for gallery images, YouTube videos, notices, documents and school profile, including drafts, publishing, expiry, pinning, file uploads and delete confirmation.
- Image resize/compression in the browser before upload. File type/size checks are also enforced by Storage bucket configuration.
- SQL migration creates the content tables, indexes, audit trigger, RLS policies and four buckets.

The app is not certified production-ready. Configure a real Supabase project and school data, then verify login, role policies, upload/delete behavior and deployment with an authorised school administrator.

## Local development

1. Install a current Node.js LTS release and Git.
2. Create a Supabase project on the Free plan if its current limits suit the school.
3. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:5173` and add `http://localhost:5173/admin/login` to the Redirect URLs list. Add the deployed site's matching admin login URL after deployment.
4. In **Authentication → Sign In / Providers → Email**, leave email/password sign-in enabled and turn off **Allow new users to sign up**. Admin accounts are created by a trusted operator in the dashboard.
5. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's **Connect** dialog or **Project Settings → API Keys**. The publishable key is intended for browser use; never put a secret/service-role key in a `VITE_` variable.
6. In Supabase **SQL Editor**, run `supabase/migrations/202611220001_initial_schema.sql`.
7. If you already ran the original schema migration before explicit Data API grants were added, run `supabase/migrations/202611260001_api_role_grants.sql` once. It adds table privileges without changing the existing RLS policies.
8. Optionally run `supabase/seed.sql` in the SQL editor to create the generic school profile, then run `npm install` and `npm run dev`.

Without `.env.local`, the public pages still render their empty states and setup notice, while authentication and data editing remain unavailable.

## Database and first administrator

The migration creates `admin_profiles`, `school_profile`, `gallery_images`, `videos`, `important_updates`, `downloadable_documents`, `event_categories` and `admin_activity_logs`. Public visitors can read published content; expired notices are hidden by both the query and RLS. Admin writes require a matching `admin_profiles.user_id`. Storage buckets are private: admins can manage files, and public clients can request a signed link only for media attached to currently published content.

Provision the first administrator from trusted Supabase controls:

1. In **Authentication → Users**, create the account with the intended email and a strong temporary password. Do not expose a public signup screen.
2. Copy its User UID.
3. In SQL Editor, run this with the actual UUID:

   ```sql
   insert into public.admin_profiles (user_id, display_name)
   values ('00000000-0000-0000-0000-000000000000', 'School Administrator');
   ```

4. Use **Reset password** on the login page to send the account owner a reset link. For further administrators, repeat the trusted Supabase Dashboard steps. The browser intentionally cannot grant administrator access or create Auth users; this avoids exposing a service-role credential or creating a public escalation path.
5. Create the initial school profile by signing in and opening **School profile**. Update all generic content and contact details.

The site's Forgot password link redirects to `/admin/login`, where the administrator can enter a new password. The local and deployed `/admin/login` URLs must be on the Supabase Redirect URLs allow list for this flow to complete.

The `admin_activity_logs` table records insert, update and delete metadata. The initial dashboard shows recent content; audit rows can be inspected in the Supabase Table Editor by an authorised project owner. Admin email/UID provisioning stays in Supabase’s trusted console.

### File uploads

The migration creates `school-assets`, `gallery`, `documents` and `video-thumbnails`. Gallery accepts JPEG/PNG/WebP and compresses images to WebP at a maximum 2000 px edge. Documents accept PDF, DOC and DOCX (10 MB maximum). The admin UI uploads a single PDF attachment per notice and multiple images per gallery entry. Videos are embedded from YouTube; no video file uploads are used.

## GitHub and deployment

1. Replace all generic profile text and the stock hero photo with school-approved information and imagery. Confirm the school has permission to publish each photo; do not publish student personal data.
2. Create an empty GitHub repository. From this project folder, run `git add .`, `git commit -m "Build school website"`, `git remote add origin https://github.com/USERNAME/REPOSITORY.git` and `git push -u origin main`. Do not commit `.env.local`.
3. Deploy the static Vite build by connecting that repository to Vercel, using `npm run build` and `dist` as the output directory. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under the Vercel project's Production environment variables, then deploy.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to the deployed `https://PROJECT.vercel.app` address and add `https://PROJECT.vercel.app/admin/login` to Redirect URLs. Save, then test password reset.
5. `vercel.json` rewrites client-side routes to `index.html`. No Vercel function or server is used. Vercel automatically assigns a `PROJECT.vercel.app` address; choose an available project name that suits the school.
6. Test the public site while logged out. Sign in as the provisioned admin and test draft visibility, publishing, expiry, edits, deletes, uploads, password reset and sign-out. Use a second unauthorised account to confirm it cannot read drafts or write content.

### Free-plan notes

Service plans and eligibility can change. Supabase currently lists a $0 Free plan, but also notes inactive projects can be paused after one week and lists database, storage and egress quotas. Check [Supabase’s current pricing and limits](https://supabase.com/pricing) before relying on it for an official service. This app avoids server-side compute and video storage to conserve quota.

Vercel Hobby is free but its terms restrict use to personal or non-commercial use. A government school website is non-commercial in purpose, but the school should confirm that its particular use qualifies before deploying there; if uncertain, obtain approval from the hosting provider or choose an eligible host. See [Vercel Hobby terms](https://vercel.com/docs/plans/hobby) and [Vercel Terms](https://vercel.com/legal/terms).

GitHub Pages can host static files for public repositories, but its published rules say Pages should not be used for sensitive transactions such as sending passwords. This site has an admin login, so do not deploy the authenticated site to Pages. The app uses browser history routing; Vercel’s rewrite supports deep links.

## Project layout

```text
src/
  components/       reusable public content and route guard
  context/          Supabase auth/session context
  lib/              Supabase client, storage and content services
  pages/            public pages, login and admin workspace
  styles.css        responsive site and dashboard styles
supabase/
  migrations/       schema, RLS, storage and audit triggers
```

## Free-tier operating guidance

- Keep student records and personal contact information out of public content.
- Prefer YouTube embeds; compress photos; upload only necessary school documents.
- Monitor Supabase quotas and project status. The Free plan has no uptime commitment and may pause inactive projects.
- Never disable RLS to troubleshoot. Fix the policy or membership row through trusted Supabase controls.
- Free plans are subject to provider terms and can change; confirm eligibility and limits before launch.
