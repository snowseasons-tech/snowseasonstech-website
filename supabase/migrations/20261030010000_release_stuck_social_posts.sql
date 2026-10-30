-- Social media suite, phase 3 follow-up: release posts stuck in 'publishing'.
--
-- A crash between begin_social_publish and finish_social_publish leaves a post in
-- 'publishing'. An admin can release it, but only after the post has been stuck for
-- 10 minutes, which is far longer than a publish attempt takes. Release marks the
-- post failed, not published. The platform may already have the post, so the
-- message tells the admin to check before retrying.

create or replace function public.release_stuck_social_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
  v_updated_at timestamptz;
begin
  select org_id, status, updated_at into v_org_id, v_status, v_updated_at
  from public.social_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  if coalesce(public.current_org_role(v_org_id), '') not in ('owner', 'admin') then
    raise exception 'Only owners and admins can release posts' using errcode = '42501';
  end if;

  if v_status <> 'publishing' then
    raise exception 'Only posts that are publishing can be released (status is %)', v_status;
  end if;

  if v_updated_at > now() - interval '10 minutes' then
    raise exception 'This post is still publishing. Wait at least 10 minutes before releasing it.';
  end if;

  update public.social_posts
  set status = 'failed',
      platform_post_id = null,
      error = 'Publishing did not finish because the connection was interrupted. The post may already be live on the platform. Check the platform before you retry.',
      updated_at = now()
  where id = p_post_id;
end;
$$;

revoke all on function public.release_stuck_social_post(uuid) from public;
grant execute on function public.release_stuck_social_post(uuid) to authenticated;
