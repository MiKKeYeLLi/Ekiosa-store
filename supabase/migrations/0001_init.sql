-- Loam storefront: catalog, profiles and orders.
-- Apply in the Supabase SQL editor (or `supabase db push`), then run supabase/seed.sql.

-- ─── Catalog ──────────────────────────────────────────────────────
create table public.categories (
  slug        text primary key,
  name        text not null,
  description text not null default '',
  image       text not null default '',
  sort_order  int  not null default 0
);

create table public.products (
  id                text primary key,
  slug              text not null unique,
  name              text not null,
  brand             text not null,
  category          text not null references public.categories (slug),
  price             int  not null check (price >= 0),             -- cents
  compare_at_price  int  check (compare_at_price is null or compare_at_price >= 0),
  rating            numeric(2, 1) not null default 0,
  review_count      int  not null default 0,
  stock             int  not null default 0 check (stock >= 0),
  short_description text not null default '',
  description       text not null default '',
  highlights        text[] not null default '{}',
  details           jsonb  not null default '[]',
  images            jsonb  not null default '[]',
  tags              text[] not null default '{}',
  created_at        date   not null default current_date,
  -- Derived columns used for filtering/sorting.
  on_sale boolean generated always as (compare_at_price is not null and compare_at_price > price) stored,
  featured_score numeric generated always as (
    ln(review_count + 1) / ln(10) + rating
    + case when 'featured'   = any (tags) then 3 else 0 end
    + case when 'bestseller' = any (tags) then 2 else 0 end
    - case when stock = 0 then 4 else 0 end
  ) stored
);

create index products_category_idx on public.products (category);
create index products_price_idx on public.products (price);

-- ─── Profiles ─────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Copy name/avatar from the Google identity when a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Orders ───────────────────────────────────────────────────────
create table public.orders (
  id                         uuid primary key default gen_random_uuid(),
  number                     text not null unique,
  user_id                    uuid not null references auth.users (id) on delete restrict,
  email                      text not null,
  phone                      text,
  marketing_opt_in           boolean not null default false,
  status                     text not null default 'confirmed',
  shipping_address           jsonb not null,
  shipping_method            jsonb not null,
  promo                      jsonb,
  subtotal                   int not null,
  discount                   int not null default 0,
  shipping                   int not null default 0,
  tax                        int not null default 0,
  total                      int not null,
  estimated_delivery_from    timestamptz not null,
  estimated_delivery_to      timestamptz not null,
  confirmation_email_sent_at timestamptz,
  created_at                 timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);

create table public.order_items (
  id               bigint generated always as identity primary key,
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       text not null references public.products (id),
  slug             text not null,
  name             text not null,
  image            text not null default '',
  category         text not null,
  unit_price       int  not null,
  compare_at_price int,
  quantity         int  not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- ─── Row-level security ───────────────────────────────────────────
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.profiles    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "Catalog is public" on public.categories for select using (true);
create policy "Products are public" on public.products for select using (true);

create policy "Read own profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles for update using ((select auth.uid()) = id);

create policy "Read own orders" on public.orders for select using ((select auth.uid()) = user_id);
create policy "Read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
);
-- No insert/update/delete policies: orders are only written by create_order() via the service role.

-- ─── Atomic order creation ────────────────────────────────────────
-- p_order: { email, phone, marketing_opt_in, shipping_address, shipping_method, promo,
--            subtotal, discount, shipping, tax, total, estimated_delivery_from, estimated_delivery_to }
-- p_items: [{ product_id, slug, name, image, category, unit_price, compare_at_price, quantity }]
create function public.create_order(p_user uuid, p_order jsonb, p_items jsonb)
returns table (id uuid, number text)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_item     jsonb;
  v_stock    int;
  v_order_id uuid;
  v_number   text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order';
  end if;

  -- Lock rows in a stable order to avoid deadlocks, then check and decrement stock.
  for v_item in
    select value from jsonb_array_elements(p_items) order by value ->> 'product_id'
  loop
    select p.stock into v_stock from public.products p
      where p.id = v_item ->> 'product_id' for update;
    if v_stock is null then
      raise exception 'product_not_found:%', v_item ->> 'product_id';
    end if;
    if v_stock < (v_item ->> 'quantity')::int then
      raise exception 'out_of_stock:%', v_item ->> 'product_id';
    end if;
    update public.products set stock = stock - (v_item ->> 'quantity')::int
      where products.id = v_item ->> 'product_id';
  end loop;

  -- Human-friendly order number, retried on the (rare) collision.
  loop
    v_number := 'LM-' || lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from public.orders o where o.number = v_number);
  end loop;

  insert into public.orders (
    number, user_id, email, phone, marketing_opt_in, shipping_address, shipping_method, promo,
    subtotal, discount, shipping, tax, total, estimated_delivery_from, estimated_delivery_to
  ) values (
    v_number, p_user, p_order ->> 'email', p_order ->> 'phone',
    coalesce((p_order ->> 'marketing_opt_in')::boolean, false),
    p_order -> 'shipping_address', p_order -> 'shipping_method', nullif(p_order -> 'promo', 'null'::jsonb),
    (p_order ->> 'subtotal')::int, (p_order ->> 'discount')::int, (p_order ->> 'shipping')::int,
    (p_order ->> 'tax')::int, (p_order ->> 'total')::int,
    (p_order ->> 'estimated_delivery_from')::timestamptz, (p_order ->> 'estimated_delivery_to')::timestamptz
  )
  returning orders.id into v_order_id;

  insert into public.order_items (order_id, product_id, slug, name, image, category, unit_price, compare_at_price, quantity)
  select v_order_id, i ->> 'product_id', i ->> 'slug', i ->> 'name', coalesce(i ->> 'image', ''), i ->> 'category',
         (i ->> 'unit_price')::int, nullif(i ->> 'compare_at_price', '')::int, (i ->> 'quantity')::int
  from jsonb_array_elements(p_items) as i;

  return query select v_order_id, v_number;
end;
$$;

revoke execute on function public.create_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(uuid, jsonb, jsonb) to service_role;
