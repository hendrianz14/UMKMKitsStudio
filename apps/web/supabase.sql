create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  attempt_count int not null default 0,
  last_sent_at timestamptz not null default now(),
  created_ip text,
  created_at timestamptz not null default now()
);
create index if not exists email_otps_idx on public.email_otps (email, consumed, expires_at);
