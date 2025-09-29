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
