import { sendToAll } from "@/lib/push-store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sent = await sendToAll({ title: "🔔 Better You test alert", body: "Phone notifications are working — even when the app is closed.", tag: `test-${Date.now()}` });
    return Response.json({ ok: true, sent });
  } catch {
    return Response.json({ ok: false, sent: 0 }, { status: 500 });
  }
}
