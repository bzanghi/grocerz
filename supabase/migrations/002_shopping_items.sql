-- shopping_items table for core shopping list (planning mode)
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity text,
  category text,
  is_checked boolean default false,
  estimated_price numeric(10,2),
  created_at timestamptz default now(),
  created_by uuid references public.users(id)
);

alter table public.shopping_items enable row level security;

-- Policies: members of a household can manage items for their household
create policy if not exists "household members can read items"
on public.shopping_items for select
using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_items.household_id
  )
);

create policy if not exists "household members can insert items"
on public.shopping_items for insert
with check (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_items.household_id
  )
);

create policy if not exists "household members can update items"
on public.shopping_items for update
using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_items.household_id
  )
)
with check (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_items.household_id
  )
);

create policy if not exists "household members can delete items"
on public.shopping_items for delete
using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_items.household_id
  )
);
