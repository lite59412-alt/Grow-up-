import { getVapidKeys } from "@/lib/push-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { publicKey } = await getVapidKeys();
    return Response.json({ publicKey });
  } catch {
    return Response.json({ error: "Push is unavailable" }, { status: 500 });
  }
}
