import { ensurePushTables, saveSubscription } from "@/lib/push-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { endpoint?: string; keys?: { p256dh?: string; auth?: string }; tzOffset?: number };
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) return Response.json({ ok: false }, { status: 400 });
    await ensurePushTables();
    await saveSubscription({ endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, tzOffset: Math.round(body.tzOffset ?? 0) });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
