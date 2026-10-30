-- Social media suite, phase 1: tenants, membership, and the blog review queue.
--
-- Writes never touch the tables directly. Every mutation goes through a
-- security definer function that checks membership, role, and status, so the
-- rules live in the database rather than only in the app.

create extension if not exists pgcrypto;

-- Tenants -------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Blog review queue -----------------------------------------------------------

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9-]{1,120}$'),
  body text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'rejected', 'published')),
  author_id uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create index if not exists blog_posts_org_status_idx on public.blog_posts (org_id, status);

-- Row level security ----------------------------------------------------------
-- Tables are readable only by members of their org. There are no insert,
-- update, or delete policies, so writes must go through the functions below.

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.blog_posts enable row level security;

-- Returns the caller's role in an org, or null. Security definer so policies
-- can use it without recursing into organization_members' own policies.
create or replace function public.current_org_role(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.organization_members m
  where m.org_id = p_org_id and m.user_id = auth.uid();
$$;

create policy organizations_member_select on public.organizations
  for select to authenticated
  using (public.current_org_role(id) is not null);

create policy organization_members_member_select on public.organization_members
  for select to authenticated
  using (public.current_org_role(org_id) is not null);

create policy blog_posts_member_select on public.blog_posts
  for select to authenticated
  using (public.current_org_role(org_id) is not null);

-- Functions -------------------------------------------------------------------

create or replace function public.create_organization(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create an organization' using errcode = '42501';
  end if;

  insert into public.organizations (name, slug)
  values (trim(p_name), lower(trim(p_slug)))
  returning id into v_org_id;

  insert into public.organization_members (org_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;

create or replace function public.create_blog_draft(
  p_org_id uuid,
  p_title text,
  p_slug text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
begin
  if public.current_org_role(p_org_id) is null then
    raise exception 'You are not a member of this organization' using errcode = '42501';
  end if;

  insert into public.blog_posts (org_id, title, slug, body, author_id)
  values (p_org_id, trim(p_title), lower(trim(p_slug)), p_body, auth.uid())
  returning id into v_post_id;

  return v_post_id;
end;
$$;

-- Editing is allowed only while a post is a draft or was sent back.
create or replace function public.update_blog_draft(
  p_post_id uuid,
  p_title text,
  p_slug text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
begin
  select org_id, status into v_org_id, v_status
  from public.blog_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  if public.current_org_role(v_org_id) is null then
    raise exception 'You are not a member of this organization' using errcode = '42501';
  end if;

  if v_status not in ('draft', 'rejected') then
    raise exception 'Only drafts and rejected posts can be edited (status is %)', v_status;
  end if;

  update public.blog_posts
  set title = trim(p_title),
      slug = lower(trim(p_slug)),
      body = p_body,
      updated_at = now()
  where id = p_post_id;
end;
$$;

-- Moves a post through the review workflow. The allowed moves are:
--   any member:      draft -> in_review, rejected -> in_review
--   owner / admin:   in_review -> approved, in_review -> rejected,
--                    approved -> published, published -> draft
create or replace function public.transition_blog_post(p_post_id uuid, p_to text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_from text;
  v_role text;
  v_needs_admin boolean;
begin
  select org_id, status into v_org_id, v_from
  from public.blog_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  v_role := public.current_org_role(v_org_id);
  if v_role is null then
    raise exception 'You are not a member of this organization' using errcode = '42501';
  end if;

  if (v_from, p_to) in (('draft', 'in_review'), ('rejected', 'in_review')) then
    v_needs_admin := false;
  elsif (v_from, p_to) in (
    ('in_review', 'approved'),
    ('in_review', 'rejected'),
    ('approved', 'published'),
    ('published', 'draft')
  ) then
    v_needs_admin := true;
  else
    raise exception 'Cannot move a post from % to %', v_from, p_to;
  end if;

  if v_needs_admin and v_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can move a post from % to %', v_from, p_to
      using errcode = '42501';
  end if;

  update public.blog_posts
  set status = p_to,
      updated_at = now(),
      reviewed_by = case when p_to in ('approved', 'rejected') then auth.uid() else reviewed_by end,
      reviewed_at = case when p_to in ('approved', 'rejected') then now() else reviewed_at end,
      published_at = case
        when p_to = 'published' then now()
        when p_to = 'draft' then null
        else published_at
      end
  where id = p_post_id;
end;
$$;

-- Adds an existing account to an org. The person must have signed up first.
-- Owners are never changed here, so an admin cannot demote or replace an owner.
create or replace function public.add_organization_member(
  p_org_id uuid,
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if coalesce(public.current_org_role(p_org_id), '') not in ('owner', 'admin') then
    raise exception 'Only owners and admins can add members' using errcode = '42501';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Role must be admin or member';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'No account exists for that email yet. Ask them to sign up first.';
  end if;

  if exists (
    select 1 from public.organization_members
    where org_id = p_org_id and user_id = v_user_id and role = 'owner'
  ) then
    raise exception 'Owners cannot be changed here';
  end if;

  insert into public.organization_members (org_id, user_id, role)
  values (p_org_id, v_user_id, p_role)
  on conflict (org_id, user_id) do update set role = excluded.role;
end;
$$;

-- Public reads ----------------------------------------------------------------
-- Anonymous visitors never query the tables. These functions expose only
-- published posts and only the org name, so org membership stays private.

create or replace function public.public_blog_posts(p_org_slug text)
returns table (org_name text, title text, slug text, published_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select o.name, p.title, p.slug, p.published_at
  from public.blog_posts p
  join public.organizations o on o.id = p.org_id
  where o.slug = p_org_slug and p.status = 'published'
  order by p.published_at desc;
$$;

create or replace function public.public_blog_post(p_org_slug text, p_slug text)
returns table (org_name text, title text, slug text, body text, published_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select o.name, p.title, p.slug, p.body, p.published_at
  from public.blog_posts p
  join public.organizations o on o.id = p.org_id
  where o.slug = p_org_slug and p.slug = p_slug and p.status = 'published';
$$;

-- Lock down function execution, then grant only what each caller needs.
revoke all on function public.current_org_role(uuid) from public;
revoke all on function public.create_organization(text, text) from public;
revoke all on function public.create_blog_draft(uuid, text, text, text) from public;
revoke all on function public.update_blog_draft(uuid, text, text, text) from public;
revoke all on function public.transition_blog_post(uuid, text) from public;
revoke all on function public.add_organization_member(uuid, text, text) from public;
revoke all on function public.public_blog_posts(text) from public;
revoke all on function public.public_blog_post(text, text) from public;

grant execute on function public.current_org_role(uuid) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.create_blog_draft(uuid, text, text, text) to authenticated;
grant execute on function public.update_blog_draft(uuid, text, text, text) to authenticated;
grant execute on function public.transition_blog_post(uuid, text) to authenticated;
grant execute on function public.add_organization_member(uuid, text, text) to authenticated;
grant execute on function public.public_blog_posts(text) to anon, authenticated;
grant execute on function public.public_blog_post(text, text) to anon, authenticated;
