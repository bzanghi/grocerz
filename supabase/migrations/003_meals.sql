-- meals table
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prep_time integer,
  is_kid_friendly boolean default false,
  is_quick_meal boolean default false,
  image_url text,
  is_custom boolean default false,
  household_id uuid references public.households(id)
);

-- meal_ingredients table
create table if not exists public.meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  ingredient_name text not null,
  base_quantity text,
  category text
);

alter table public.meals enable row level security;
alter table public.meal_ingredients enable row level security;

-- Policies
-- Curated meals: is_custom=false and household_id is null -> readable by all
create policy if not exists "curated meals readable by all" on public.meals for select
using (is_custom = false and household_id is null);

-- Custom meals: user household read/write
create policy if not exists "household meals readable" on public.meals for select
using (household_id is null or exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = meals.household_id));

create policy if not exists "household meals insert" on public.meals for insert
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = meals.household_id));

create policy if not exists "household meals update" on public.meals for update
using (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = meals.household_id))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = meals.household_id));

create policy if not exists "household meals delete" on public.meals for delete
using (exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = meals.household_id));

-- meal_ingredients readable if parent meal readable
create policy if not exists "meal ingredients readable" on public.meal_ingredients for select
using (exists (select 1 from public.meals m where m.id = meal_ingredients.meal_id and (m.household_id is null or exists (select 1 from public.users u where u.id = auth.uid() and u.household_id = m.household_id))));

-- Seed a few curated meals
insert into public.meals (name, prep_time, is_kid_friendly, is_quick_meal, image_url, is_custom, household_id)
values
  ('Spaghetti with Meat Sauce', 25, true, true, 'https://images.unsplash.com/photo-1604908176997-43162f2ff8bb?q=80&w=1200&auto=format&fit=crop', false, null),
  ('Chicken Tacos', 30, true, true, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1200&auto=format&fit=crop', false, null),
  ('Veggie Stir Fry', 20, true, true, 'https://images.unsplash.com/photo-1512056481453-2aa5b8a3a2c1?q=80&w=1200&auto=format&fit=crop', false, null)
on conflict do nothing;

-- Spaghetti ingredients (base quantities for 4 servings)
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'spaghetti', '1 lb', 'Pantry' from public.meals where name='Spaghetti with Meat Sauce' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'ground beef', '1 lb', 'Meat' from public.meals where name='Spaghetti with Meat Sauce' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'tomato sauce', '24 oz', 'Pantry' from public.meals where name='Spaghetti with Meat Sauce' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'onion', '1', 'Produce' from public.meals where name='Spaghetti with Meat Sauce' limit 1;

-- Chicken Tacos
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'chicken breast', '1 lb', 'Meat' from public.meals where name='Chicken Tacos' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'taco seasoning', '1 packet', 'Pantry' from public.meals where name='Chicken Tacos' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'tortillas', '10', 'Bakery' from public.meals where name='Chicken Tacos' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'lettuce', '1 head', 'Produce' from public.meals where name='Chicken Tacos' limit 1;

-- Veggie Stir Fry
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'mixed vegetables', '4 cups', 'Produce' from public.meals where name='Veggie Stir Fry' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'soy sauce', '1/4 cup', 'Pantry' from public.meals where name='Veggie Stir Fry' limit 1;
insert into public.meal_ingredients (meal_id, ingredient_name, base_quantity, category)
select id, 'garlic', '3 cloves', 'Produce' from public.meals where name='Veggie Stir Fry' limit 1;
