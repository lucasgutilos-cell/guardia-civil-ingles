-- MANUAL REVIEW ONLY. No table or row is deleted by this script.
-- Expected existing schema: profiles.id uuid, attempts.user_id uuid,
-- failure_bank.user_id uuid. Review policies and types before running.
begin;
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.failure_bank enable row level security;
-- PUBLIC privileges are inherited by anon; authenticated must not keep TRUNCATE.
revoke all on public.profiles, public.attempts, public.failure_bank from public, anon, authenticated;
grant select, insert, update, delete on public.profiles, public.attempts, public.failure_bank to authenticated;

drop policy if exists gc_profiles_owner on public.profiles;
create policy gc_profiles_owner on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists gc_profiles_owner_guard on public.profiles;
create policy gc_profiles_owner_guard on public.profiles as restrictive for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists gc_attempts_owner on public.attempts;
create policy gc_attempts_owner on public.attempts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists gc_attempts_owner_guard on public.attempts;
create policy gc_attempts_owner_guard on public.attempts as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists gc_failures_owner on public.failure_bank;
create policy gc_failures_owner on public.failure_bank for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists gc_failures_owner_guard on public.failure_bank;
create policy gc_failures_owner_guard on public.failure_bank as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;

-- Inspect every existing policy (including PUBLIC policies) and table grants:
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename in ('profiles','attempts','failure_bank');
