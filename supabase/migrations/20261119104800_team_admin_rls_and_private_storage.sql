-- 1. DEFINE TAMPER-PROOF ADMIN HELPER VIA JWT APP_METADATA
create or replace function public.is_team_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'team_admin',
    false
  );
$$;

-- 2. LOCK DOWN ALL TABLES TO TEAM ADMINS ONLY
drop policy if exists "Admin full access on clients" on public.clients;
drop policy if exists "Admin full access on stays" on public.stays;
drop policy if exists "Admin full access on dossiers" on public.onboarding_dossiers;
drop policy if exists "Admin full access on updates" on public.daily_updates;
drop policy if exists "Admin full access on incidentals" on public.incidentals;
drop policy if exists "Admin full access on payments" on public.payment_events;

drop policy if exists "Team admins only on clients" on public.clients;
drop policy if exists "Team admins only on stays" on public.stays;
drop policy if exists "Team admins only on dossiers" on public.onboarding_dossiers;
drop policy if exists "Team admins only on updates" on public.daily_updates;
drop policy if exists "Team admins only on incidentals" on public.incidentals;
drop policy if exists "Team admins only on payments" on public.payment_events;

create policy "Team admins only on clients"
on public.clients for all using (public.is_team_admin()) with check (public.is_team_admin());

create policy "Team admins only on stays"
on public.stays for all using (public.is_team_admin()) with check (public.is_team_admin());

create policy "Team admins only on dossiers"
on public.onboarding_dossiers for all using (public.is_team_admin()) with check (public.is_team_admin());

create policy "Team admins only on updates"
on public.daily_updates for all using (public.is_team_admin()) with check (public.is_team_admin());

create policy "Team admins only on incidentals"
on public.incidentals for all using (public.is_team_admin()) with check (public.is_team_admin());

create policy "Team admins only on payments"
on public.payment_events for all using (public.is_team_admin()) with check (public.is_team_admin());

-- 3. LOCK DOWN STAY-MEDIA BUCKET TO PRIVATE + TEAM ADMINS ONLY
update storage.buckets
set public = false
where id = 'stay-media';

drop policy if exists "Authenticated upload to stay-media" on storage.objects;
drop policy if exists "Public read access on stay-media" on storage.objects;
drop policy if exists "Team admins can upload to stay-media" on storage.objects;
drop policy if exists "Team admins can view stay-media" on storage.objects;
drop policy if exists "Team admins can delete stay-media" on storage.objects;

create policy "Team admins can upload to stay-media"
on storage.objects for insert
with check (bucket_id = 'stay-media' and public.is_team_admin());

create policy "Team admins can view stay-media"
on storage.objects for select
using (bucket_id = 'stay-media' and public.is_team_admin());

create policy "Team admins can delete stay-media"
on storage.objects for delete
using (bucket_id = 'stay-media' and public.is_team_admin());
