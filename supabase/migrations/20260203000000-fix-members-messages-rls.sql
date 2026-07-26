-- Fix: allow all members to view the full member list (not just their own row)
-- Fix: messages insert policy uses direct subquery instead of helper function to avoid recursion

-- Drop the restrictive select policies
drop policy if exists community_members_select_self on public.community_members;
drop policy if exists community_members_select_admin on public.community_members;

-- New unified select: any authenticated user who is a member OR the community creator can see all rows
-- Uses a direct subquery on communities (no recursion) for admin check
-- Uses a self-join subquery for member check (reads only own row first, safe)
create policy community_members_select_all_members
  on public.community_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
    or exists (
      select 1 from public.community_members cm2
      where cm2.community_id = community_id and cm2.user_id = auth.uid()
    )
  );

-- Fix messages select: use direct subquery instead of helper function
drop policy if exists community_messages_select_member on public.community_messages;
create policy community_messages_select_member
  on public.community_messages for select
  using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id and cm.user_id = auth.uid()
    )
  );

-- Fix messages insert: use direct subquery instead of helper function
drop policy if exists community_messages_insert_member on public.community_messages;
create policy community_messages_insert_member
  on public.community_messages for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id and cm.user_id = auth.uid()
    )
  );

-- Fix messages delete: use direct subquery
drop policy if exists community_messages_delete_admin on public.community_messages;
create policy community_messages_delete_own_or_admin
  on public.community_messages for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
  );
