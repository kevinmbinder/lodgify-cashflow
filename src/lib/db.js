import { neon } from "@neondatabase/serverless";

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("No database URL configured (DATABASE_URL or POSTGRES_URL)");
  return neon(url);
}

let schemaReady = false;

export async function initSchema() {
  if (schemaReady) return;
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id BIGINT PRIMARY KEY,
      data JSONB NOT NULL,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sync_log (
      id SERIAL PRIMARY KEY,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      booking_count INTEGER,
      error TEXT
    )
  `;
  schemaReady = true;
}

export async function syncBookings(bookings) {
  const sql = getDb();
  await initSchema();

  // Full replacement: delete the active set and re-insert.
  // Any row missing from bookings[] has been cancelled/removed upstream.
  // A concurrent GET seeing an empty table falls back to a live seed (see /api/bookings).
  await sql`DELETE FROM bookings`;

  for (const b of bookings) {
    const data = JSON.stringify(b);
    await sql`
      INSERT INTO bookings (id, data, synced_at)
      VALUES (${b.id}, ${data}::jsonb, NOW())
    `;
  }

  await sql`INSERT INTO sync_log (booking_count) VALUES (${bookings.length})`;
}

export async function getBookings() {
  const sql = getDb();
  await initSchema();
  const rows = await sql`
    SELECT data FROM bookings
    ORDER BY (data->>'arrival')::date ASC NULLS LAST
  `;
  return rows.map((r) => r.data);
}

export async function getLastSyncedAt() {
  const sql = getDb();
  await initSchema();
  const rows = await sql`SELECT synced_at FROM sync_log ORDER BY synced_at DESC LIMIT 1`;
  return rows[0]?.synced_at ?? null;
}
