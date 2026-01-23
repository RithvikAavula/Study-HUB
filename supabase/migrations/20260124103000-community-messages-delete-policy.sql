-- Allow message authors or community creators (admins) to delete messages
-- Assumes RLS is enabled on public.community_messages

-- Create delete policy: author or community creator can delete
create policy community_messages_delete_author_or_admin
  on public.community_messages for delete
  using (
    -- Author of the message
    user_id = auth.uid()
    -- Or creator of the community (admin)
    or exists (
      select 1 from public.communities c
      where c.id = community_id and c.created_by = auth.uid()
    )
  );
