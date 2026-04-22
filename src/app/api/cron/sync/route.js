import { fetchLodgifyBookings } from "@/lib/lodgifyFetch";
import { syncBookings } from "@/lib/db";

export async function GET(req) {
  // Vercel automatically sends Authorization: Bearer {CRON_SECRET} from cron jobs.
  // When CRON_SECRET is set (production), require it; skip check in local dev.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.LODGIFY_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "LODGIFY_API_KEY not set" }, { status: 500 });
  }

  try {
    const bookings = await fetchLodgifyBookings(apiKey);
    await syncBookings(bookings);
    return Response.json({ ok: true, count: bookings.length, synced_at: new Date().toISOString() });
  } catch (e) {
    console.error("Cron sync failed:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
