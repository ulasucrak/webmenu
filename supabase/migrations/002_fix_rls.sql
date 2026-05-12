-- Fix: infinite recursion in admin_users policies
-- Solution: security-definer functions bypass RLS when reading admin_users

-- Helper: get current user's role without triggering RLS
create or replace function get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from admin_users where id = auth.uid() limit 1;
$$;

-- Helper: get current user's restaurant_id without triggering RLS
create or replace function get_my_restaurant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select restaurant_id from admin_users where id = auth.uid() limit 1;
$$;

-- Drop all recursive policies
drop policy if exists "Superadmin full access restaurants" on restaurants;
drop policy if exists "Superadmin full access branches" on branches;
drop policy if exists "Manager read own restaurant" on restaurants;
drop policy if exists "Manager write own restaurant" on restaurants;
drop policy if exists "Manager read own branches" on branches;
drop policy if exists "Manager write own branches" on branches;
drop policy if exists "Manager write categories" on categories;
drop policy if exists "Manager write subcategories" on subcategories;
drop policy if exists "Manager write products" on products;
drop policy if exists "Admin read own profile" on admin_users;
drop policy if exists "Superadmin manage admin_users" on admin_users;

-- Recreate using helper functions (no recursion)

-- Restaurants
create policy "Manager read own restaurant" on restaurants
  for select using (id = get_my_restaurant_id());

create policy "Manager write own restaurant" on restaurants
  for update using (id = get_my_restaurant_id());

create policy "Superadmin full access restaurants" on restaurants
  for all using (get_my_role() = 'superadmin');

-- Branches
create policy "Manager read own branches" on branches
  for select using (restaurant_id = get_my_restaurant_id());

create policy "Manager write own branches" on branches
  for all using (restaurant_id = get_my_restaurant_id());

create policy "Superadmin full access branches" on branches
  for all using (get_my_role() = 'superadmin');

-- Categories: managers can write to their restaurant's branches
create policy "Manager write categories" on categories
  for all using (
    branch_id in (
      select id from branches where restaurant_id = get_my_restaurant_id()
    )
  );

-- Subcategories: managers can write to their categories
create policy "Manager write subcategories" on subcategories
  for all using (
    category_id in (
      select c.id from categories c
      join branches b on b.id = c.branch_id
      where b.restaurant_id = get_my_restaurant_id()
    )
  );

-- Products: managers can write to their subcategories
create policy "Manager write products" on products
  for all using (
    subcategory_id in (
      select s.id from subcategories s
      join categories c on c.id = s.category_id
      join branches b on b.id = c.branch_id
      where b.restaurant_id = get_my_restaurant_id()
    )
  );

-- Admin users: simple self-read, superadmin manages all
create policy "Admin read own profile" on admin_users
  for select using (id = auth.uid());

create policy "Superadmin manage admin_users" on admin_users
  for all using (get_my_role() = 'superadmin');
