import { z } from "zod";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";
const codeSchema = z.object({ code: z.string().min(1).max(160) });

function codesMatch(received: string, expected: string) {
  if (received.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < received.length; index += 1) mismatch |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  return mismatch === 0;
}

export async function POST(request: Request) {
  try {
    const parsed = codeSchema.safeParse(await request.json());
    const organizerCode = process.env.ORGANIZER_CODE;
    if (!parsed.success || !organizerCode || !codesMatch(parsed.data.code, organizerCode)) {
      return Response.json({ error: "Código de acesso inválido." }, { status: 401 });
    }

    const rows = await getDb().sql`
      SELECT id,
             name AS "giftName",
             reserved_by_name AS "guestName",
             reserved_by_email AS "guestEmail",
             reserved_at AS "reservedAt"
      FROM gifts
      ORDER BY sort_order ASC
    `;

    return Response.json(
      { reservations: rows.filter((row) => row.reservedAt !== null), total: rows.length },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return Response.json({ error: "Não foi possível abrir a área do organizador." }, { status: 500 });
  }
}
