-- Social media suite, phase 2: record where each blog draft came from.
--
-- AI drafts enter the same review queue as manual drafts. They are marked so
-- reviewers can see which posts need a closer read, and the model is recorded
-- for audit.

alter table public.blog_posts
  add column source text not null default 'manual' check (source in ('manual', 'ai')),
  add column ai_model text;

-- Replace the phase 1 signature. Callers that pass four arguments still work
-- because the new parameters have defaults.
drop function public.create_blog_draft(uuid, text, text, text);

create or replace function public.create_blog_draft(
  p_org_id uuid,
  p_title text,
  p_slug text,
  p_body text,
  p_source text default 'manual',
  p_ai_model text default null
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

  insert into public.blog_posts (org_id, title, slug, body, author_id, source, ai_model)
  values (
    p_org_id,
    trim(p_title),
    lower(trim(p_slug)),
    p_body,
    auth.uid(),
    p_source,
    case when p_source = 'ai' then p_ai_model else null end
  )
  returning id into v_post_id;

  return v_post_id;
end;
$$;

revoke all on function public.create_blog_draft(uuid, text, text, text, text, text) from public;
grant execute on function public.create_blog_draft(uuid, text, text, text, text, text) to authenticated;
