import { hasAdminSession } from "@/lib/admin-auth";
import { getAllGiftReservations, getAllGifts, getAllRsvps, getPartyConfig } from "@/lib/party-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const [party, gifts, reservations, rsvps] = await Promise.all([
      getPartyConfig(),
      getAllGifts(),
      getAllGiftReservations(),
      getAllRsvps(),
    ]);
    return Response.json({ party, gifts, reservations, rsvps });
  } catch {
    return Response.json({ error: "Não foi possível carregar o painel." }, { status: 503 });
  }
}
