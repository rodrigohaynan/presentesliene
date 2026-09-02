import { getDb } from "@/db";

export const dynamic = "force-dynamic";
const REVEAL_AT = new Date("2026-09-11T04:00:00.000Z");

export async function GET() {
  if (new Date() < REVEAL_AT) {
    return Response.json({ unlocked: false, revealAt: REVEAL_AT.toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  const reservations = await getDb().sql`
    SELECT name AS "giftName", reserved_by_name AS "guestName"
    FROM gifts
    WHERE reserved_at IS NOT NULL
    ORDER BY sort_order ASC
  `;
  return Response.json({ unlocked: true, reservations }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
