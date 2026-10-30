-- Social media suite, phase 3: connected social accounts and social posts.
--
-- Access tokens are stored encrypted by the application (AES-256-GCM, key held
-- in the server environment). Members can read account metadata but never the
-- ciphertext: column privileges hide token_ciphertext from everyone except the
-- security-definer publish function, which admins call.

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('linkedin', 'facebook', 'instagram')),
  external_id text not null check (char_length(external_id) between 1 and 100),
  display_name text not null check (char_length(display_name) between 1 and 200),
  token_ciphertext text not null,
  token_expires_at timestamptz,
  connected_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, provider, external_id)
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  account_id uuid not null references public.social_accounts (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  image_url text check (image_url is null or image_url ~ '^https://'),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'publishing', 'published', 'failed')),
  author_id uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  platform_post_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_org_status_idx on public.social_posts (org_id, status);

alter table public.social_accounts enable row level security;
alter table public.social_posts enable row level security;

create policy social_accounts_member_select on public.social_accounts
  for select to authenticated
  using (public.current_org_role(org_id) is not null);

create policy social_posts_member_select on public.social_posts
  for select to authenticated
  using (public.current_org_role(org_id) is not null);

-- Column privileges: members see account metadata, never the token ciphertext.
revoke all on public.social_accounts from anon, authenticated;
grant select (id, org_id, provider, external_id, display_name, token_expires_at, connected_by, created_at)
  on public.social_accounts to authenticated;

revoke all on public.social_posts from anon, authenticated;
grant select on public.social_posts to authenticated;

-- Account management (owners and admins) -------------------------------------

create or replace function public.save_social_account(
  p_org_id uuid,
  p_provider text,
  p_external_id text,
  p_display_name text,
  p_token_ciphertext text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
begin
  if coalesce(public.current_org_role(p_org_id), '') not in ('owner', 'admin') then
    raise exception 'Only owners and admins can connect accounts' using errcode = '42501';
  end if;

  insert into public.social_accounts (
    org_id, provider, external_id, display_name, token_ciphertext, token_expires_at, connected_by
  )
  values (
    p_org_id, p_provider, p_external_id, trim(p_display_name), p_token_ciphertext, p_expires_at, auth.uid()
  )
  on conflict (org_id, provider, external_id) do update
    set display_name = excluded.display_name,
        token_ciphertext = excluded.token_ciphertext,
        token_expires_at = excluded.token_expires_at,
        connected_by = excluded.connected_by
  returning id into v_account_id;

  return v_account_id;
end;
$$;

create or replace function public.disconnect_social_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from public.social_accounts where id = p_account_id;
  if not found then
    raise exception 'Account not found';
  end if;

  if coalesce(public.current_org_role(v_org_id), '') not in ('owner', 'admin') then
    raise exception 'Only owners and admins can disconnect accounts' using errcode = '42501';
  end if;

  delete from public.social_accounts where id = p_account_id;
end;
$$;

-- Post content ----------------------------------------------------------------

-- Instagram only publishes images, so it needs an image URL. Other providers accept text alone.
create or replace function public.check_social_post_content(p_provider text, p_image_url text)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_provider = 'instagram' and p_image_url is null then
    raise exception 'Instagram posts need an image URL';
  end if;
end;
$$;

create or replace function public.create_social_post(
  p_org_id uuid,
  p_account_id uuid,
  p_body text,
  p_image_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text;
  v_post_id uuid;
begin
  if public.current_org_role(p_org_id) is null then
    raise exception 'You are not a member of this organization' using errcode = '42501';
  end if;

  select provider into v_provider
  from public.social_accounts
  where id = p_account_id and org_id = p_org_id;

  if not found then
    raise exception 'Account not found in this organization';
  end if;

  perform public.check_social_post_content(v_provider, nullif(trim(p_image_url), ''));

  insert into public.social_posts (org_id, account_id, body, image_url, author_id)
  values (p_org_id, p_account_id, trim(p_body), nullif(trim(p_image_url), ''), auth.uid())
  returning id into v_post_id;

  return v_post_id;
end;
$$;

-- Editing is allowed while a post is a draft or failed. Failed posts go back to draft first.
create or replace function public.update_social_post(
  p_post_id uuid,
  p_body text,
  p_image_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
  v_provider text;
begin
  select p.org_id, p.status, a.provider
    into v_org_id, v_status, v_provider
  from public.social_posts p
  join public.social_accounts a on a.id = p.account_id
  where p.id = p_post_id
  for update of p;

  if not found then
    raise exception 'Post not found';
  end if;

  if public.current_org_role(v_org_id) is null then
    raise exception 'You are not a member of this organization' using errcode = '42501';
  end if;

  if v_status not in ('draft', 'failed') then
    raise exception 'Only drafts and failed posts can be edited (status is %)', v_status;
  end if;

  perform public.check_social_post_content(v_provider, nullif(trim(p_image_url), ''));

  update public.social_posts
  set body = trim(p_body),
      image_url = nullif(trim(p_image_url), ''),
      updated_at = now()
  where id = p_post_id;
end;
$$;

-- Review workflow ---------------------------------------------------------------
-- Members: draft -> in_review, failed -> draft
-- Admins:  in_review -> approved, in_review -> draft (send back)
-- Publishing is a separate step, handled by begin_social_publish.

create or replace function public.transition_social_post(p_post_id uuid, p_to text)
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
  from public.social_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  v_role := public.current_org_role(v_org_id);
  if v_role is null then
    raise exception 'You are not a member of this organization' using errcode = '42501';
  end if;

  if (v_from, p_to) in (('draft', 'in_review'), ('failed', 'draft')) then
    v_needs_admin := false;
  elsif (v_from, p_to) in (('in_review', 'approved'), ('in_review', 'draft')) then
    v_needs_admin := true;
  else
    raise exception 'Cannot move a post from % to %', v_from, p_to;
  end if;

  if v_needs_admin and v_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can move a post from % to %', v_from, p_to
      using errcode = '42501';
  end if;

  update public.social_posts
  set status = p_to,
      updated_at = now(),
      reviewed_by = case when p_to = 'approved' then auth.uid() else reviewed_by end,
      reviewed_at = case when p_to = 'approved' then now() else reviewed_at end
  where id = p_post_id;
end;
$$;

-- Publishing (admins only) -----------------------------------------------------
-- begin_social_publish locks an approved post into 'publishing' and returns what
-- the server needs to call the platform, including the encrypted token. The
-- caller decrypts the token in memory and never stores it.

create or replace function public.begin_social_publish(p_post_id uuid)
returns table (
  provider_name text,
  account_external_id text,
  account_token_ciphertext text,
  post_body text,
  post_image_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
begin
  select org_id, status into v_org_id, v_status
  from public.social_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  if coalesce(public.current_org_role(v_org_id), '') not in ('owner', 'admin') then
    raise exception 'Only owners and admins can publish' using errcode = '42501';
  end if;

  if v_status <> 'approved' then
    raise exception 'Only approved posts can be published (status is %)', v_status;
  end if;

  update public.social_posts
  set status = 'publishing', updated_at = now()
  where id = p_post_id;

  return query
  select a.provider, a.external_id, a.token_ciphertext, p.body, p.image_url
  from public.social_posts p
  join public.social_accounts a on a.id = p.account_id
  where p.id = p_post_id;
end;
$$;

create or replace function public.finish_social_publish(
  p_post_id uuid,
  p_platform_post_id text,
  p_error text
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
  from public.social_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  if coalesce(public.current_org_role(v_org_id), '') not in ('owner', 'admin') then
    raise exception 'Only owners and admins can publish' using errcode = '42501';
  end if;

  if v_status <> 'publishing' then
    raise exception 'Post is not publishing (status is %)', v_status;
  end if;

  if p_error is null then
    update public.social_posts
    set status = 'published',
        platform_post_id = p_platform_post_id,
        error = null,
        published_at = now(),
        updated_at = now()
    where id = p_post_id;
  else
    update public.social_posts
    set status = 'failed',
        platform_post_id = null,
        error = left(p_error, 500),
        updated_at = now()
    where id = p_post_id;
  end if;
end;
$$;

-- Lock down execution, then grant to signed-in users only.
revoke all on function public.save_social_account(uuid, text, text, text, text, timestamptz) from public;
revoke all on function public.disconnect_social_account(uuid) from public;
revoke all on function public.check_social_post_content(text, text) from public;
revoke all on function public.create_social_post(uuid, uuid, text, text) from public;
revoke all on function public.update_social_post(uuid, text, text) from public;
revoke all on function public.transition_social_post(uuid, text) from public;
revoke all on function public.begin_social_publish(uuid) from public;
revoke all on function public.finish_social_publish(uuid, text, text) from public;

grant execute on function public.save_social_account(uuid, text, text, text, text, timestamptz) to authenticated;
grant execute on function public.disconnect_social_account(uuid) to authenticated;
grant execute on function public.create_social_post(uuid, uuid, text, text) to authenticated;
grant execute on function public.update_social_post(uuid, text, text) to authenticated;
grant execute on function public.transition_social_post(uuid, text) to authenticated;
grant execute on function public.begin_social_publish(uuid) to authenticated;
grant execute on function public.finish_social_publish(uuid, text, text) to authenticated;
