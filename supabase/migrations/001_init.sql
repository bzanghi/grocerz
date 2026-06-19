-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- households
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text
);

-- users (profile)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  household_id uuid references public.households(id),
  created_at timestamptz default now()
);

-- household_invites
create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text,
  token text not null unique,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_by uuid references public.users(id),
  accepted_at timestamptz
);

-- RLS
alter table public.households enable row level security;
alter table public.users enable row level security;
alter table public.household_invites enable row level security;

-- Policies
create policy "Users can view own profile" on public.users for select
  using (auth.uid() = id);

create policy "Users can upsert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Users can view their household" on public.households for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = households.id));

create policy "Invites readable by invited or creator" on public.household_invites for select
  using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.household_id = household_invites.household_id
    ) or email is not null and email = auth.jwt() ->> 'email'
  );

create policy "Invite creation by household member" on public.household_invites for insert with check (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = household_invites.household_id
  )
);

-- RPC to accept invite safely
create or replace function public.accept_invite(invite_token text)
returns void
language plpgsql
security definer
as $$
declare
  inv record;
begin
  select * into inv from public.household_invites
  where token = invite_token and now() < coalesce(expires_at, now());
  if inv is null then
    raise exception 'Invite not found or expired';
  end if;

  update public.users set household_id = inv.household_id where id = auth.uid();
  update public.household_invites set accepted_by = auth.uid(), accepted_at = now() where id = inv.id;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;
