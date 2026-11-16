import * as webpush from "web-push";
import { pool } from "@/db";
import { ensurePushTables, getVapidKeys, markSent, type SubscriptionRow } from "./push-store";

const MOTIVATIONS = [
  "One small step now is still progress. Start with five minutes.",
  "Missing once is human. Returning is the habit — don't miss twice.",
  "Motivation follows movement. Begin before you feel ready.",
  "Future you is watching. Do this one tiny thing for them.",
  "A pause is not a failure. Note what got in the way and return.",
];
const started = globalThis as typeof globalThis & { __betterYouPushLoop?: boolean };

function localParts(tzOffset: number) {
  const shifted = new Date(Date.now() - tzOffset * 60000);
  const date = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
  const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const dayIndex = (shifted.getUTCDay() + 6) % 7;
  return { date, minutes, dayIndex };
}

async function tick() {
  await ensurePushTables();
  const subs = await pool.query<SubscriptionRow>("SELECT endpoint, p256dh, auth, tz_offset, reminder_gap FROM push_subscriptions");
  if (!subs.rows.length) return;
  const alarms = await pool.query<{ id: string; name: string; alarm_time: string; days: number[] }>("SELECT id, name, alarm_time, days FROM push_alarms WHERE enabled = true");
  if (!alarms.rows.length) return;
  const keys = await getVapidKeys();
  webpush.setVapidDetails("mailto:hello@betteryou.app", keys.publicKey, keys.privateKey);

  for (const sub of subs.rows) {
    const { date, minutes, dayIndex } = localParts(sub.tz_offset);
    const motivation = MOTIVATIONS[Number(date.replaceAll("-", "")) % MOTIVATIONS.length];
    for (const alarm of alarms.rows) {
      if (!alarm.days.includes(dayIndex)) continue;
      const [hour, minute] = alarm.alarm_time.split(":").map(Number);
      const due = (hour || 0) * 60 + (minute || 0);
      const gap = sub.reminder_gap || 20;
      let payload: { title: string; body: string; key: string; kind: "start" | "overdue" } | null = null;
      if (minutes >= due && minutes < due + gap) {
        payload = { title: `🔔 Time for: ${alarm.name}`, body: `${alarm.alarm_time} — ${motivation}`, key: `${alarm.id}-${date}-start`, kind: "start" };
      } else if (minutes >= due + gap && minutes < due + gap + 150) {
        payload = { title: `⏰ Time over: ${alarm.name}`, body: `Still unchecked. ${motivation} If today is not possible, log the reason in Better You.`, key: `${alarm.id}-${date}-overdue`, kind: "overdue" };
      }
      if (!payload) continue;
      if (!(await markSent(`${sub.endpoint}-${payload.key}`))) continue;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: payload.title, body: payload.body, url: "/", tag: payload.key, kind: payload.kind, vibrate: payload.kind === "start" ? [180, 90, 180] : [300, 120, 300, 120, 300] }),
          { TTL: 3600, urgency: "high" },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [sub.endpoint]);
      }
    }
  }
  await pool.query("DELETE FROM push_sent WHERE sent_at < now() - interval '14 days'");
}

export function startPushScheduler() {
  if (started.__betterYouPushLoop) return;
  started.__betterYouPushLoop = true;
  const run = () => { void tick().catch(() => {}); };
  setTimeout(run, 8000);
  setInterval(run, 30000);
}
