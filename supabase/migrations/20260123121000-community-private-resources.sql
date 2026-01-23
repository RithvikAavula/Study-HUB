-- Private community resources stored in a private bucket with RLS

-- Create private bucket for community resources (id must be lowercase and unique)
insert into storage.buckets (id, name, public)
values ('community-resources', 'community-resources', false)
on conflict (id) do nothing;

-- Table to track custom community resources
create table if not exists public.community_custom_resources (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  file_path text not null, -- path within bucket 'community-resources', e.g., 'community/<community_id>/<filename>'
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.community_custom_resources enable row level security;

-- Policies: members can read; members can insert their own; uploader or admin can delete
create policy ccr_select_member
  on public.community_custom_resources for select
  using (public.is_community_member(community_id));

create policy ccr_insert_member
  on public.community_custom_resources for insert
  with check (public.is_community_member(community_id) and uploaded_by = auth.uid());

create policy ccr_delete_owner_or_admin
  on public.community_custom_resources for delete
  using (uploaded_by = auth.uid() or public.is_community_admin(community_id));

create index if not exists idx_ccr_comm on public.community_custom_resources(community_id);
create index if not exists idx_ccr_uploader on public.community_custom_resources(uploaded_by);

-- Storage policies for bucket 'community-resources'
-- Path convention: 'community/<community_id>/<rest>'
-- Allow members to select (read) objects under their community path
create policy stor_ccr_select_member
  on storage.objects for select
  using (
    bucket_id = 'community-resources' and
    exists (
      select 1
      from public.community_members m
      where m.community_id = uuid(split_part(name, '/', 2))
        and m.user_id = auth.uid()
    )
  );

-- Allow members to upload objects to their community path
create policy stor_ccr_insert_member
  on storage.objects for insert
  with check (
    bucket_id = 'community-resources' and
    exists (
      select 1
      from public.community_members m
      where m.community_id = uuid(split_part(name, '/', 2))
        and m.user_id = auth.uid()
    )
  );

-- Allow uploader to delete their own objects
create policy stor_ccr_delete_owner
  on storage.objects for delete
  using (
    bucket_id = 'community-resources' and
    owner = auth.uid()
  );

-- Additionally allow community admins to delete any object in their community path
create policy stor_ccr_delete_admin
  on storage.objects for delete
  using (
    bucket_id = 'community-resources' and
    exists (
      select 1
      from public.community_members m
      where m.community_id = uuid(split_part(name, '/', 2))
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );
