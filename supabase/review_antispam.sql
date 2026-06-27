-- ============================================================
-- Review anti-spam: server-side rate limiting (run once)
-- Client-side limits are bypassable, so the real guard lives here.
-- These run on INSERT only — editing your own review (an UPDATE via
-- the unique constraint) is not throttled.
-- ============================================================

create or replace function public.enforce_review_rate_limit()
returns trigger
language plpgsql
security definer           -- runs as the owner so it can count all of a user's reviews
set search_path = public, pg_temp
as $$
declare
  recent_count   integer;
  last_review_at timestamptz;
begin
  if TG_OP <> 'INSERT' then
    return new;
  end if;

  -- ---- Optional: require a verified email --------------------
  -- Uncomment to block reviews from unverified accounts (a strong
  -- anti-spam measure used by most apps).
  -- if not exists (
  --   select 1 from auth.users
  --   where id = new.user_id and email_confirmed_at is not null
  -- ) then
  --   raise exception 'UNVERIFIED: Please verify your email before posting a review.';
  -- end if;

  -- Max 5 new reviews per user per rolling hour
  select count(*) into recent_count
  from public.shop_reviews
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'RATE_LIMIT: You are posting reviews too quickly. Please try again later.';
  end if;

  -- 60-second cooldown between reviews
  select max(created_at) into last_review_at
  from public.shop_reviews
  where user_id = new.user_id;

  if last_review_at is not null and now() - last_review_at < interval '60 seconds' then
    raise exception 'COOLDOWN: Please wait a moment before posting another review.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_review_rate_limit on public.shop_reviews;
create trigger trg_review_rate_limit
  before insert on public.shop_reviews
  for each row execute function public.enforce_review_rate_limit();
