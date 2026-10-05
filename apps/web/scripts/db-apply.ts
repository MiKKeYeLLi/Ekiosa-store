/**
 * Applies supabase/migrations/*.sql (once each), then seeds an empty catalog from supabase/seed.sql.
 * Run with: npm run db:apply   (needs SUPABASE_DB_URL in .env.local)
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const root = join(import.meta.dirname, "..", "..", "..", "supabase");
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Set SUPABASE_DB_URL in .env.local first.");
  process.exit(1);
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query(`create table if not exists public._migrations (name text primary key, applied_at timestamptz default now())`);
  await client.query(`alter table public._migrations enable row level security`);

  const done = new Set((await client.query<{ name: string }>("select name from public._migrations")).rows.map((r) => r.name));
  const files = readdirSync(join(root, "migrations")).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (done.has(file)) {
      console.log(`✓ ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(root, "migrations", file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public._migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`✓ ${file} applied`);
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }

  // Seed only an empty catalog, unless --seed is passed (never touches stock either way).
  const count = async () => (await client.query<{ n: string }>("select count(*)::text as n from public.products")).rows[0].n;
  if ((await count()) === "0" || process.argv.includes("--seed")) {
    await client.query(readFileSync(join(root, "seed.sql"), "utf8"));
    console.log(`✓ seed.sql applied — ${await count()} products`);
  } else {
    console.log(`✓ catalog already has ${await count()} products — seed skipped (pass --seed to refresh product details)`);
  }

  // Ask PostgREST to pick up the new tables immediately.
  await client.query("notify pgrst, 'reload schema'");
}

main()
  .catch((err) => {
    console.error("✗", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
