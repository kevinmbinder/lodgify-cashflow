const BASE = "https://api.lodgify.com";
const CANCELLED_STATUSES = new Set(["Canceled", "Cancelled", "Declined", "Archived"]);

export async function fetchLodgifyBookings(apiKey) {
  const headers = { "X-ApiKey": apiKey, Accept: "application/json" };

  const [propRes, firstPageRes] = await Promise.all([
    fetch(`${BASE}/v2/properties`, { headers }),
    fetch(`${BASE}/v2/reservations/bookings?includeCount=true&page=1&size=100`, { headers }),
  ]);

  const propertyMap = {};
  if (propRes.ok) {
    const propData = await propRes.json();
    for (const p of propData.items || []) {
      propertyMap[p.id] = p.name;
    }
  }

  if (!firstPageRes.ok) {
    const body = await firstPageRes.text();
    throw new Error(`Lodgify API error ${firstPageRes.status}: ${body}`);
  }

  const firstData = await firstPageRes.json();
  const allBookings = [...(firstData.items || firstData.bookings || [])];
  const total = firstData.total_count ?? firstData.count ?? allBookings.length;

  if (total > 100) {
    const pageCount = Math.ceil(total / 100);
    const remaining = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) =>
        fetch(`${BASE}/v2/reservations/bookings?includeCount=true&page=${i + 2}&size=100`, { headers })
          .then((r) => r.json())
          .then((d) => d.items || d.bookings || [])
      )
    );
    allBookings.push(...remaining.flat());
  }

  return allBookings
    .filter((b) => {
      if (CANCELLED_STATUSES.has(b.status)) return false;
      if (b.canceled_at) return false;
      const isOta = b.source !== "Manual";
      if (!isOta && b.status === "Open" && b.is_unavailable) return false;
      return true;
    })
    .map((b) => ({
      ...b,
      property_name: propertyMap[b.property_id] || b.property_name || null,
    }));
}
