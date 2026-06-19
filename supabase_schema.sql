-- APMAC Database Schema
-- Run this once in Supabase: Dashboard → SQL Editor → New Query → paste this → Run

-- ── PROFILES ──────────────────────────────────────────────────────────────────
-- Extends Supabase's built-in auth.users with APMAC-specific data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'paid')),
  free_topic_used boolean default false,
  selected_trade text,
  onboarding_done boolean default false,
  cum_score integer,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── JOURNEY LOG ──────────────────────────────────────────────────────────────
-- Every completed session: discussion, self-study, discovery, classification
create table public.journey_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  label text not null,
  score integer,
  tier text,
  created_at timestamptz default now()
);

alter table public.journey_log enable row level security;

create policy "Users can view their own journey log"
  on public.journey_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journey log entries"
  on public.journey_log for insert
  with check (auth.uid() = user_id);

-- ── COMPLETED TOPICS ─────────────────────────────────────────────────────────
-- Tracks which topic+mode combos a user has finished, with their score
create table public.completed_topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic_key text not null, -- e.g. "el-w-01" or "el-w-01_self"
  score integer not null,
  created_at timestamptz default now(),
  unique(user_id, topic_key)
);

alter table public.completed_topics enable row level security;

create policy "Users can view their own completed topics"
  on public.completed_topics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completed topics"
  on public.completed_topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own completed topics"
  on public.completed_topics for update
  using (auth.uid() = user_id);

-- ── EMPLOYER VIEW ────────────────────────────────────────────────────────────
-- A view employers can query to see verified worker profiles (read-only, scoped)
create view public.public_worker_profiles as
select
  p.id,
  p.selected_trade,
  p.cum_score,
  p.plan,
  p.created_at,
  count(distinct ct.topic_key) as topics_completed
from public.profiles p
left join public.completed_topics ct on ct.user_id = p.id
group by p.id, p.selected_trade, p.cum_score, p.plan, p.created_at;
