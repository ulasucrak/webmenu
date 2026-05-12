-- ============================================================
-- Restaurants
-- ============================================================
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text default '#000000',
  created_at timestamptz default now()
);

-- ============================================================
-- Branches
-- ============================================================
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  slug text not null,
  address text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(restaurant_id, slug)
);

-- ============================================================
-- Categories
-- ============================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade not null,
  name_tr text not null,
  name_en text,
  description_tr text,
  description_en text,
  cover_url text,
  cover_type text default 'image',  -- 'image' | 'video'
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- Subcategories
-- ============================================================
create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade not null,
  name_tr text not null,
  name_en text,
  display_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- Products
-- ============================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  subcategory_id uuid references subcategories(id) on delete cascade not null,
  external_id int,
  name_tr text not null,
  name_en text,
  description_tr text,
  description_en text,
  price numeric(10,2) not null,
  currency text default '₺',
  image_url text,
  is_active boolean default true,
  is_featured boolean default false,
  display_order int default 0,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ============================================================
-- Admin Users
-- ============================================================
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete set null,
  role text default 'manager',  -- 'superadmin' | 'manager'
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table restaurants enable row level security;
alter table branches enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table products enable row level security;
alter table admin_users enable row level security;

-- Public read access for active data
create policy "Public read restaurants" on restaurants
  for select using (true);

create policy "Public read branches" on branches
  for select using (is_active = true);

create policy "Public read categories" on categories
  for select using (is_active = true);

create policy "Public read subcategories" on subcategories
  for select using (true);

create policy "Public read products" on products
  for select using (is_active = true);

-- Managers can write their own restaurant's data
create policy "Manager write categories" on categories
  for all using (
    exists (
      select 1 from admin_users au
      join branches b on b.restaurant_id = au.restaurant_id
      where au.id = auth.uid()
        and b.id = categories.branch_id
    )
  );

create policy "Manager write subcategories" on subcategories
  for all using (
    exists (
      select 1 from admin_users au
      join branches b on b.restaurant_id = au.restaurant_id
      join categories c on c.branch_id = b.id
      where au.id = auth.uid()
        and c.id = subcategories.category_id
    )
  );

create policy "Manager write products" on products
  for all using (
    exists (
      select 1 from admin_users au
      join branches b on b.restaurant_id = au.restaurant_id
      join categories c on c.branch_id = b.id
      join subcategories s on s.category_id = c.id
      where au.id = auth.uid()
        and s.id = products.subcategory_id
    )
  );

create policy "Manager read own restaurant" on restaurants
  for select using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and restaurant_id = restaurants.id
    )
  );

create policy "Manager write own restaurant" on restaurants
  for update using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and restaurant_id = restaurants.id
    )
  );

create policy "Superadmin full access restaurants" on restaurants
  for all using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'superadmin'
    )
  );

create policy "Superadmin full access branches" on branches
  for all using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'superadmin'
    )
  );

create policy "Manager read own branches" on branches
  for select using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and restaurant_id = branches.restaurant_id
    )
  );

create policy "Manager write own branches" on branches
  for all using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and restaurant_id = branches.restaurant_id
    )
  );

create policy "Admin read own profile" on admin_users
  for select using (id = auth.uid());

create policy "Superadmin manage admin_users" on admin_users
  for all using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'superadmin'
    )
  );
