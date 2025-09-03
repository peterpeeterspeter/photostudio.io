-- Photostudio.io Database Setup
-- Run this in your Supabase SQL editor

-- Create profiles table to store user subscription info
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text,
  plan text default 'free',                -- 'free' | 'pro' | 'agency'
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Function to automatically update the updated_at timestamp
create or replace function public.set_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

-- Trigger to call the function before each update
create trigger trg_profiles_updated
before update on public.profiles
for each row execute procedure public.set_profiles_updated_at();

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- RLS Policies: each user can only read/update their own profile
create policy "Read own profile" on public.profiles for select
  using (auth.uid() = id);

create policy "Update own profile" on public.profiles for update
  using (auth.uid() = id);

create policy "Insert self" on public.profiles for insert
  with check (auth.uid() = id);

-- Function to automatically create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end; $$ language plpgsql security definer;

-- Trigger to call the function after user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();