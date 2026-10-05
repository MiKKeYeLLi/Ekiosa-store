-- Mobile app support: wishlist, push tokens and order status values.

-- ─── Wishlist ─────────────────────────────────────────────────────
create table public.wishlist_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist_items enable row level security;

create policy "Read own wishlist" on public.wishlist_items
  for select using ((select auth.uid()) = user_id);
create policy "Add to own wishlist" on public.wishlist_items
  for insert with check ((select auth.uid()) = user_id);
create policy "Remove from own wishlist" on public.wishlist_items
  for delete using ((select auth.uid()) = user_id);

-- ─── Push notification tokens (Expo) ──────────────────────────────
create table public.push_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Read own push tokens" on public.push_tokens
  for select using ((select auth.uid()) = user_id);
create policy "Register own push token" on public.push_tokens
  for insert with check ((select auth.uid()) = user_id);
create policy "Update own push token" on public.push_tokens
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Remove own push token" on public.push_tokens
  for delete using ((select auth.uid()) = user_id);

-- A device token can move between accounts (sign out → sign in as someone else).
-- Clients call this instead of a plain upsert, which RLS would block for another user's row.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, (select auth.uid()), p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- ─── Order status ─────────────────────────────────────────────────
alter table public.orders
  add constraint orders_status_check check (status in ('confirmed', 'shipped', 'delivered', 'cancelled'));
