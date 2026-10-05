-- Server-side cart so a signed-in user's bag syncs between the web store and the mobile app.

create table public.cart_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  quantity   int  not null check (quantity between 1 and 99),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- One row per user for cart-level state (applied promo code).
create table public.carts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  promo_code text,
  updated_at timestamptz not null default now()
);

alter table public.cart_items enable row level security;
alter table public.carts enable row level security;

create policy "Read own cart items" on public.cart_items for select using ((select auth.uid()) = user_id);
create policy "Add own cart items" on public.cart_items for insert with check ((select auth.uid()) = user_id);
create policy "Update own cart items" on public.cart_items for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Remove own cart items" on public.cart_items for delete using ((select auth.uid()) = user_id);

create policy "Read own cart" on public.carts for select using ((select auth.uid()) = user_id);
create policy "Create own cart" on public.carts for insert with check ((select auth.uid()) = user_id);
create policy "Update own cart" on public.carts for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Replace the caller's whole cart in one transaction.
-- p_items: [{ "product_id": "p_001", "quantity": 2 }, ...]
-- Runs as the caller (security invoker), so row-level security still applies.
create or replace function public.replace_cart(p_items jsonb, p_promo_code text default null)
returns void
language plpgsql
security invoker set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.cart_items c
  where c.user_id = v_user
    and c.product_id not in (select i ->> 'product_id' from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as i);

  insert into public.cart_items (user_id, product_id, quantity, updated_at)
  select v_user, i ->> 'product_id', least(greatest((i ->> 'quantity')::int, 1), 99), now()
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as i
  where exists (select 1 from public.products p where p.id = i ->> 'product_id') -- skip discontinued products
  on conflict (user_id, product_id) do update set quantity = excluded.quantity, updated_at = now();

  insert into public.carts (user_id, promo_code, updated_at)
  values (v_user, nullif(trim(p_promo_code), ''), now())
  on conflict (user_id) do update set promo_code = excluded.promo_code, updated_at = now();
end;
$$;

revoke execute on function public.replace_cart(jsonb, text) from public, anon;
grant execute on function public.replace_cart(jsonb, text) to authenticated;
