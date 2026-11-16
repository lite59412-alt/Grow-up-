import { replaceAlarms } from "@/lib/push-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { alarms?: { id?: string; name?: string; time?: string; days?: number[] }[] };
    const alarms = (body.alarms ?? [])
      .filter((alarm): alarm is { id: string; name: string; time: string; days: number[] } => Boolean(alarm.id && alarm.name && alarm.time && Array.isArray(alarm.days)))
      .map((alarm) => ({ id: alarm.id, name: alarm.name, time: alarm.time, days: alarm.days }));
    await replaceAlarms(alarms);
    return Response.json({ ok: true, alarms: alarms.length });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
