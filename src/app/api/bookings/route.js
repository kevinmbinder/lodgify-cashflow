import { getBookings, getLastSyncedAt, syncBookings } from "@/lib/db";
import { fetchLodgifyBookings } from "@/lib/lodgifyFetch";

export async function GET() {
  try {
    const [bookings, syncedAt] = await Promise.all([getBookings(), getLastSyncedAt()]);

    // On first deployment (empty DB), seed immediately rather than showing a blank screen
    if (bookings.length === 0 && !syncedAt) {
      const apiKey = process.env.LODGIFY_API_KEY;
      if (apiKey) {
        const fresh = await fetchLodgifyBookings(apiKey);
        await syncBookings(fresh);
        const seededAt = new Date().toISOString();
        return Response.json({ bookings: fresh, syncedAt: seededAt });
      }
    }

    return Response.json({ bookings, syncedAt });
  } catch (e) {
    console.error("/api/bookings error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
