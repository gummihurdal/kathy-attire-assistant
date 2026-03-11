-- =============================================
-- Kathy Atelier Privé — Supabase Setup
-- Run this in Supabase → SQL Editor
-- =============================================

-- 1. Wardrobe Items Table
create table if not exists public.wardrobe_items (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  category text not null,
  colors text[] default '{}',
  description text default '',
  brand text default '',
  season text[] default '{}',
  image_url text default '',
  created_at timestamptz default now()
);

-- Index for fast user lookups
create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id);

-- Enable Row Level Security
alter table public.wardrobe_items enable row level security;

-- Policy: users can only see/edit their own items
create policy "Users can manage own wardrobe items"
  on public.wardrobe_items
  for all
  using (user_id = auth.uid()::text or user_id = 'demo')
  with check (user_id = auth.uid()::text or user_id = 'demo');

-- =============================================
-- 2. Saved Outfits Table
-- =============================================
create table if not exists public.saved_outfits (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  style text not null,
  item_ids text[] default '{}',
  data jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_saved_outfits_user_id on public.saved_outfits(user_id);

alter table public.saved_outfits enable row level security;

create policy "Users can manage own saved outfits"
  on public.saved_outfits
  for all
  using (user_id = auth.uid()::text or user_id = 'demo')
  with check (user_id = auth.uid()::text or user_id = 'demo');

-- =============================================
-- 3. Storage Bucket for Wardrobe Images
-- =============================================
-- Run this in Supabase → Storage → Create bucket named "wardrobe"
-- Set to PUBLIC
-- Or use the SQL below:

insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Storage policy: authenticated users can upload to their own folder
create policy "Users can upload their own wardrobe images"
  on storage.objects for insert
  with check (bucket_id = 'wardrobe' and auth.role() = 'authenticated');

create policy "Wardrobe images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'wardrobe');

create policy "Users can delete their own wardrobe images"
  on storage.objects for delete
  using (bucket_id = 'wardrobe' and auth.uid()::text = split_part(name, '/', 1));
