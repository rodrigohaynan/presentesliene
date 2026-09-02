import { SURPRISE_REVEAL_AT } from "@/lib/party-data";
import { getAllGiftReservations } from "@/lib/party-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (Date.now() < new Date(SURPRISE_REVEAL_AT).getTime()) {
      return Response.json({ unlocked: false, revealAt: SURPRISE_REVEAL_AT });
    }
    const reservations = await getAllGiftReservations();
    return Response.json({
      unlocked: true,
      reservations: reservations.map(({ giftName, guestName }) => ({ giftName, guestName })),
    });
  } catch {
    return Response.json({ error: "Não foi possível preparar a surpresa agora." }, { status: 503 });
  }
}
