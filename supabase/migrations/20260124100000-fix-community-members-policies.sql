-- Fix RLS recursion causing stack depth exceeded on community membership checks
-- This migration replaces community_members policies to avoid calling helper
-- functions that query the same table, which led to recursive RLS evaluation.

-- Drop problematic policies if they exist
drop policy if exists community_members_select_member on public.community_members;
drop policy if exists community_members_insert_admin on public.community_members;
drop policy if exists community_members_delete_admin on public.community_members;

-- Recreate select policy: allow admins (community creators) to view all rows
create policy community_members_select_admin
  on public.community_members for select
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
  );

-- Keep existing self-view policy intact (defined in prior migration):
-- create policy community_members_select_self on public.community_members for select using (user_id = auth.uid());

-- Recreate insert policy: only admins (community creators) can add members
create policy community_members_insert_admin
  on public.community_members for insert
  with check (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
    and role = 'member'
  );

-- Recreate delete policy: only admins (community creators) can delete membership rows
create policy community_members_delete_admin
  on public.community_members for delete
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
  );

-- Notes:
-- - Helper functions public.is_community_member/admin remain for other tables (e.g., messages),
--   but community_members policies no longer invoke them to prevent recursive RLS.
-- - Communities table allows global SELECT, so the EXISTS checks do not trigger RLS recursion.
