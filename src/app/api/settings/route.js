import { getSettings, saveSettings } from "@/lib/db";

export async function GET() {
  try {
    const data = await getSettings();
    return Response.json({ settings: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await saveSettings(body);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
