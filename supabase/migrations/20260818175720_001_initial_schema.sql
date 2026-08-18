-- =====================================================
-- ScrapLens — Supabase Migration 001: Initial Schema
-- =====================================================
-- Run this in the Supabase SQL Editor or via supabase CLI:
-- supabase db push

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- TABLE: profiles
-- Extended user profile linked to auth.users
-- =====================================================
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  full_name    text,
  company      text,
  avatar_url   text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- TABLE: materials_catalog
-- Configurable price catalog for scrap materials
-- =====================================================
create table if not exists public.materials_catalog (
  id              uuid default uuid_generate_v4() primary key,
  name            text not null,
  category        text not null,  -- 'metal', 'wood', 'plastic', 'construction'
  subtype         text,
  price_per_kg    numeric(10, 4) not null default 0,
  currency        text default 'EUR' not null,
  unit            text default 'kg' not null,
  description     text,
  color_hex       text,           -- for UI display
  is_active       boolean default true,
  last_updated    timestamptz default now(),
  created_at      timestamptz default now() not null
);

-- RLS: catalog is readable by all authenticated users, writable by admin only
alter table public.materials_catalog enable row level security;

create policy "Authenticated users can read catalog"
  on public.materials_catalog for select
  to authenticated
  using (is_active = true);

-- =====================================================
-- TABLE: scraps
-- Individual scrap items identified by the scanner
-- =====================================================
create table if not exists public.scraps (
  id                    uuid default uuid_generate_v4() primary key,
  user_id               uuid references auth.users(id) on delete cascade not null,
  material_id           uuid references public.materials_catalog(id),
  material_name         text not null,
  category              text not null,
  subtype               text,
  image_url             text,
  image_path            text,            -- Supabase Storage path
  weight_kg             numeric(10, 3) not null default 0,
  price_per_kg          numeric(10, 4) not null default 0,
  total_value           numeric(10, 2) not null default 0,
  currency              text default 'EUR' not null,
  ai_confidence         numeric(3, 2),   -- 0.0 to 1.0
  condition_notes       text,
  reference_object      text,            -- 'coin', 'hand', 'tape'
  status                text default 'available' not null check (status in ('available', 'in_lot', 'sold', 'discarded')),
  is_demo               boolean default false,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- Indexes
create index if not exists scraps_user_id_idx on public.scraps(user_id);
create index if not exists scraps_status_idx on public.scraps(status);
create index if not exists scraps_created_at_idx on public.scraps(created_at desc);
create index if not exists scraps_category_idx on public.scraps(category);

-- RLS
alter table public.scraps enable row level security;

create policy "Users can CRUD own scraps"
  on public.scraps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================
-- TABLE: listings
-- Lots/marketplace groups of scraps
-- =====================================================
create table if not exists public.listings (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  title           text not null,
  description     text,
  total_value     numeric(10, 2) default 0,
  total_weight_kg numeric(10, 3) default 0,
  status          text default 'draft' not null check (status in ('draft', 'active', 'sold', 'archived')),
  share_token     text unique default encode(gen_random_bytes(16), 'hex'),
  is_demo         boolean default false,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- Indexes
create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_share_token_idx on public.listings(share_token);

-- RLS
alter table public.listings enable row level security;

create policy "Users can CRUD own listings"
  on public.listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view listing by share token"
  on public.listings for select
  using (status = 'active');

-- =====================================================
-- TABLE: listing_scraps
-- Many-to-many: listings <-> scraps
-- =====================================================
create table if not exists public.listing_scraps (
  id          uuid default uuid_generate_v4() primary key,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  scrap_id    uuid references public.scraps(id) on delete cascade not null,
  created_at  timestamptz default now() not null,
  unique(listing_id, scrap_id)
);

create index if not exists listing_scraps_listing_id_idx on public.listing_scraps(listing_id);
create index if not exists listing_scraps_scrap_id_idx on public.listing_scraps(scrap_id);

-- RLS
alter table public.listing_scraps enable row level security;

create policy "Users can manage own listing scraps"
  on public.listing_scraps for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

-- =====================================================
-- Supabase Storage: scraps-images bucket
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scraps-images',
  'scraps-images',
  true,
  10485760,  -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Authenticated users can upload scrap images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'scraps-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Scrap images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'scraps-images');

create policy "Users can delete own scrap images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'scraps-images' and auth.uid()::text = (storage.foldername(name))[1]);
