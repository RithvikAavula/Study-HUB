-- Allow message authors (who are current members) or community admins to delete messages
-- Assumes RLS is enabled on public.community_messages and helper functions exist:
--   public.is_community_member(comm_id uuid)
--   public.is_community_admin(comm_id uuid)

-- Recreate delete policy to ensure membership gating and admin override
drop policy if exists community_messages_delete_author_or_admin on public.community_messages;

create policy community_messages_delete_author_or_admin
  on public.community_messages for delete
  using (
    (
      -- Authors can delete their own messages only if they are current members
      user_id = auth.uid()
      and public.is_community_member(community_id)
    )
    or
    (
      -- Community admins can delete any messages within their community
      public.is_community_admin(community_id)
    )
  );
