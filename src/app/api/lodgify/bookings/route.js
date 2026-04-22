import { fetchLodgifyBookings } from "@/lib/lodgifyFetch";

// Direct Lodgify proxy — used during local development when DATABASE_URL is not set.
// In production, /api/bookings reads from the Neon DB instead.
export async function GET() {
  const apiKey = process.env.LODGIFY_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "LODGIFY_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  try {
    const bookings = await fetchLodgifyBookings(apiKey);
    return Response.json(bookings);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
