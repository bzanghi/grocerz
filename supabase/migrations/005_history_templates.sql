-- History: Add completed_at to shopping_items to track completion time
alter table public.shopping_items
  add column if not exists completed_at timestamptz;

-- Templates: reusable shopping templates
create table if not exists public.shopping_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  created_by uuid references public.users(id)
);

create table if not exists public.shopping_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.shopping_templates(id) on delete cascade,
  name text not null,
  quantity text,
  category text
);

alter table public.shopping_templates enable row level security;
alter table public.shopping_template_items enable row level security;

create policy if not exists "household can read templates" on public.shopping_templates for select
using (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_templates.household_id));

create policy if not exists "household can insert templates" on public.shopping_templates for insert
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_templates.household_id));

create policy if not exists "household can update templates" on public.shopping_templates for update
using (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_templates.household_id))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_templates.household_id));

create policy if not exists "household can delete templates" on public.shopping_templates for delete
using (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = shopping_templates.household_id));

create policy if not exists "template items readable" on public.shopping_template_items for select
using (exists (select 1 from public.shopping_templates t join public.users u on u.household_id = t.household_id and u.id = auth.uid() where t.id = shopping_template_items.template_id));
