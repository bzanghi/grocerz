-- pantry_items table tracks what's on hand in a household pantry
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity text,
  category text,
  on_hand boolean default true,
  updated_at timestamptz default now(),
  updated_by uuid references public.users(id)
);

alter table public.pantry_items enable row level security;

-- RLS: household members can manage their pantry
create policy if not exists "household pantry read"
on public.pantry_items for select
using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = pantry_items.household_id
  )
);

create policy if not exists "household pantry insert"
on public.pantry_items for insert
with check (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = pantry_items.household_id
  )
);

create policy if not exists "household pantry update"
on public.pantry_items for update
using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = pantry_items.household_id
  )
)
with check (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = pantry_items.household_id
  )
);

create policy if not exists "household pantry delete"
on public.pantry_items for delete
using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = pantry_items.household_id
  )
);
