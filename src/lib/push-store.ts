import * as webpush from "web-push";
import { pool } from "@/db";

let ready: Promise<void> | null = null;

export async function ensurePushTables() {
  if (!ready) {
    ready = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS push_config (id integer PRIMARY KEY DEFAULT 1, public_key text NOT NULL, private_key text NOT NULL)`);
      await pool.query(`CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint text PRIMARY KEY, p256dh text NOT NULL, auth text NOT NULL, tz_offset integer NOT NULL DEFAULT 0, reminder_gap integer NOT NULL DEFAULT 20, created_at timestamptz NOT NULL DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS push_alarms (id text PRIMARY KEY, name text NOT NULL, alarm_time text NOT NULL, days integer[] NOT NULL, enabled boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS push_sent (key text PRIMARY KEY, sent_at timestamptz NOT NULL DEFAULT now())`);
    })().catch((error) => { ready = null; throw error; });
  }
  return ready;
}

export type SubscriptionRow = { endpoint: string; p256dh: string; auth: string; tz_offset: number; reminder_gap: number };

export async function getVapidKeys() {
  await ensurePushTables();
  const existing = await pool.query<{ public_key: string; private_key: string }>("SELECT public_key, private_key FROM push_config WHERE id = 1");
  if (existing.rows[0]) return { publicKey: existing.rows[0].public_key, privateKey: existing.rows[0].private_key };
  const keys = webpush.generateVAPIDKeys();
  await pool.query("INSERT INTO push_config (id, public_key, private_key) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING", [keys.publicKey, keys.privateKey]);
  const saved = await pool.query<{ public_key: string; private_key: string }>("SELECT public_key, private_key FROM push_config WHERE id = 1");
  return { publicKey: saved.rows[0].public_key, privateKey: saved.rows[0].private_key };
}

export async function saveSubscription(sub: { endpoint: string; p256dh: string; auth: string; tzOffset: number }) {
  await ensurePushTables();
  await pool.query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, tz_offset) VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, tz_offset = EXCLUDED.tz_offset`,
    [sub.endpoint, sub.p256dh, sub.auth, sub.tzOffset],
  );
}

export async function replaceAlarms(alarms: { id: string; name: string; time: string; days: number[] }[]) {
  await ensurePushTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM push_alarms");
    for (const alarm of alarms) {
      await client.query(
        "INSERT INTO push_alarms (id, name, alarm_time, days, enabled) VALUES ($1, $2, $3, $4, true) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, alarm_time = EXCLUDED.alarm_time, days = EXCLUDED.days, enabled = true, updated_at = now()",
        [alarm.id, alarm.name, alarm.time, alarm.days],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function sendToAll(payload: { title: string; body: string; tag?: string }) {
  const keys = await getVapidKeys();
  webpush.setVapidDetails("mailto:hello@betteryou.app", keys.publicKey, keys.privateKey);
  const subs = await pool.query<SubscriptionRow>("SELECT endpoint, p256dh, auth, tz_offset, reminder_gap FROM push_subscriptions");
  let sent = 0;
  for (const row of subs.rows) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify({ title: payload.title, body: payload.body, tag: payload.tag ?? "better-you", url: "/" }),
        { TTL: 3600, urgency: "high" },
      );
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [row.endpoint]);
    }
  }
  return sent;
}

export async function markSent(key: string) {
  const result = await pool.query("INSERT INTO push_sent (key) VALUES ($1) ON CONFLICT (key) DO NOTHING RETURNING key", [key]);
  return (result.rowCount ?? 0) > 0;
}
