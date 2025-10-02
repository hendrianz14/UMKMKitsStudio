-- email OTP storage
create extension if not exists "pgcrypto";

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  consumed boolean not null default false,
  attempt_count integer not null default 0,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null,
  created_ip text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_otps_email_idx on public.email_otps (email);
create index if not exists email_otps_consumed_idx on public.email_otps (consumed);
create index if not exists email_otps_expires_at_idx on public.email_otps (expires_at);

alter table if exists public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_answers jsonb,
  add column if not exists onboarding_updated_at timestamptz;
-- Dashboard credits & projects schema
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  credits integer not null default 0,
  trial_credits integer not null default 25,
  trial_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ct_user_created on public.credit_transactions(user_id, created_at desc);

create or replace function public.apply_credit_transaction()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set credits = greatest(0, coalesce(credits, 0) + NEW.amount)
  where user_id = NEW.user_id;
  return NEW;
end;
$$;

drop trigger if exists tg_apply_credit_tx on public.credit_transactions;
create trigger tg_apply_credit_tx
after insert on public.credit_transactions
for each row execute function public.apply_credit_transaction();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_user_updated on public.projects(user_id, updated_at desc);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null,
  status text not null default 'done',
  created_at timestamptz not null default now()
);
create index if not exists idx_jobs_user_created on public.ai_jobs(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.ai_jobs enable row level security;

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles select own" on public.profiles
for select using (auth.uid() = user_id);
create policy "profiles update own" on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ct select own" on public.credit_transactions;
drop policy if exists "ct insert own" on public.credit_transactions;
create policy "ct select own" on public.credit_transactions
for select using (auth.uid() = user_id);
create policy "ct insert own" on public.credit_transactions
for insert with check (auth.uid() = user_id);

drop policy if exists "projects crud own" on public.projects;
create policy "projects crud own" on public.projects
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "jobs select own" on public.ai_jobs;
drop policy if exists "jobs insert own" on public.ai_jobs;
create policy "jobs select own" on public.ai_jobs
for select using (auth.uid() = user_id);
create policy "jobs insert own" on public.ai_jobs
for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, plan, credits, trial_credits)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'free', 0, 25)
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
