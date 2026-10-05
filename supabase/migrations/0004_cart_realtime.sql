-- Broadcast changes to a user's cart so other open devices refresh immediately.
-- Only `carts` is published: every cart change (replace_cart, checkout clearing
-- the cart) touches the user's `carts` row, and row-level security limits each
-- subscriber to their own row. `cart_items` is not published, because DELETE
-- events cannot be filtered by row-level security.
alter publication supabase_realtime add table public.carts;
