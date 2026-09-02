import { z } from "zod";
import { getAvailableGifts } from "@/db/gifts";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

const reservationSchema = z.object({
  giftId: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
});

export async function GET() {
  try {
    const availableGifts = await getAvailableGifts();
    return Response.json({ gifts: availableGifts }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return Response.json({ error: "Não foi possível carregar a lista agora." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = reservationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Confira seu nome e informe um e-mail válido." }, { status: 400 });
    }

    const rows = await getDb().sql`
      UPDATE gifts
      SET reserved_by_name = ${parsed.data.name},
          reserved_by_email = ${parsed.data.email.toLowerCase()},
          reserved_at = NOW()
      WHERE id = ${parsed.data.giftId} AND reserved_at IS NULL
      RETURNING id, name
    `;
    const reservedGift = rows[0] as { id: string; name: string } | undefined;

    if (!reservedGift) {
      return Response.json({ error: "Este presente acabou de ser escolhido por outra pessoa." }, { status: 409 });
    }
    return Response.json({ gift: reservedGift }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível confirmar sua escolha. Tente novamente." }, { status: 500 });
  }
}
