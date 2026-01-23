-- Department-wise communities schema with RLS and admin workflows

-- Enable required extensions
create extension if not exists pgcrypto;

-- Communities (scoped by department)
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null,
  description text,
  is_private boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.communities enable row level security;

-- Members: creator becomes admin; others are members
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member')),
  created_at timestamptz not null default now(),
  unique(community_id, user_id)
);

alter table public.community_members enable row level security;

-- Membership requests workflow
create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  note text,
  created_at timestamptz not null default now(),
  unique(community_id, user_id)
);

alter table public.membership_requests enable row level security;

-- Community messages (chat)
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.community_messages enable row level security;

-- Community-resource linking to existing resources
create table if not exists public.community_resources (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(community_id, resource_id)
);

alter table public.community_resources enable row level security;

-- Helper functions for RLS
create or replace function public.is_community_member(comm_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = comm_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_community_admin(comm_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = comm_id and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

-- Policies
-- Communities
create policy communities_select_all
  on public.communities for select
  using (true);

create policy communities_insert_self
  on public.communities for insert
  with check (created_by = auth.uid());

create policy communities_update_admin
  on public.communities for update
  using (created_by = auth.uid());

create policy communities_delete_admin
  on public.communities for delete
  using (created_by = auth.uid());

-- Members
create policy community_members_select_member
  on public.community_members for select
  using (is_community_member(community_id) or is_community_admin(community_id));

-- Also allow users to see their own membership rows to avoid bootstrap issues
create policy community_members_select_self
  on public.community_members for select
  using (user_id = auth.uid());

create policy community_members_insert_admin
  on public.community_members for insert
  with check (is_community_admin(community_id) and role = 'member');

create policy community_members_delete_admin
  on public.community_members for delete
  using (is_community_admin(community_id));

-- Requests
create policy membership_requests_select_self_or_admin
  on public.membership_requests for select
  using (user_id = auth.uid() or is_community_admin(community_id));

create policy membership_requests_insert_self
  on public.membership_requests for insert
  with check (user_id = auth.uid());

create policy membership_requests_update_admin
  on public.membership_requests for update
  using (is_community_admin(community_id));

create policy membership_requests_delete_admin
  on public.membership_requests for delete
  using (is_community_admin(community_id));

-- Messages
create policy community_messages_select_member
  on public.community_messages for select
  using (is_community_member(community_id));

create policy community_messages_insert_member
  on public.community_messages for insert
  with check (is_community_member(community_id));

create policy community_messages_delete_admin
  on public.community_messages for delete
  using (is_community_admin(community_id));

-- Community resources
create policy community_resources_select_member
  on public.community_resources for select
  using (is_community_member(community_id));

create policy community_resources_insert_member
  on public.community_resources for insert
  with check (is_community_member(community_id));

create policy community_resources_delete_admin
  on public.community_resources for delete
  using (is_community_admin(community_id));

-- Trigger: creator becomes admin member
create or replace function public.add_creator_as_admin()
returns trigger language plpgsql security definer as $$
begin
  insert into public.community_members(community_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (community_id, user_id) do nothing;
  return new;
end;
$$;

create trigger communities_add_creator_admin
  after insert on public.communities
  for each row execute function public.add_creator_as_admin();

-- Trigger: when a request is approved, add as member
create or replace function public.add_member_on_request_approval()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'approved' then
    insert into public.community_members(community_id, user_id, role)
    values (new.community_id, new.user_id, 'member')
    on conflict (community_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger membership_requests_approval
  after update of status on public.membership_requests
  for each row execute function public.add_member_on_request_approval();

-- Guard: Only the community creator can hold 'admin' role
create or replace function public.prevent_non_creator_admin()
returns trigger language plpgsql as $$
begin
  if new.role = 'admin' then
    if not exists (
      select 1 from public.communities c
      where c.id = new.community_id and c.created_by = new.user_id
    ) then
      raise exception 'Only the community creator can be admin for this community';
    end if;
  end if;
  return new;
end;
$$;

create trigger community_members_admin_guard
  before insert or update on public.community_members
  for each row execute function public.prevent_non_creator_admin();

-- Indexes for performance
create index if not exists idx_community_members_comm on public.community_members(community_id);
create index if not exists idx_community_members_user on public.community_members(user_id);
create index if not exists idx_membership_requests_comm on public.membership_requests(community_id);
create index if not exists idx_membership_requests_user on public.membership_requests(user_id);
create index if not exists idx_messages_comm on public.community_messages(community_id);
create index if not exists idx_resources_comm on public.community_resources(community_id);

-- Admin notifications (pending requests count per community)
create or replace view public.community_admin_pending_requests as
select community_id, count(*) as pending_count
from public.membership_requests
where status = 'pending'
group by community_id;
