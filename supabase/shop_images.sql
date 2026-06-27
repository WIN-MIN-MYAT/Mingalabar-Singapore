-- ============================================================
-- Shop images (run once)
-- Adds an images[] array to shops so each shop can have a photo
-- gallery (used by the detail carousel + community list thumbnail).
-- A new column inherits the table's existing SELECT grant, so no
-- extra GRANT is needed.
-- ============================================================

alter table public.shops
  add column if not exists images text[] not null default '{}';

-- Example: attach a couple of photos to a shop
-- update public.shops
--   set images = array[
--     'https://images.unsplash.com/photo-1552566626-52f8b828add9',
--     'https://images.unsplash.com/photo-1559339352-11d035aa65de'
--   ]
--   where name = 'Golden Mile Complex';
