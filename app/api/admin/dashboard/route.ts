import { getOrganizerSessionRole } from "@/lib/admin-auth";
import { getAllGiftReservations, getAllGifts, getAllRsvps, getPartyConfig } from "@/lib/party-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getOrganizerSessionRole();
  if (!role) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const [party, gifts, reservations, rsvps] = await Promise.all([
      getPartyConfig(),
      getAllGifts(),
      getAllGiftReservations(),
      getAllRsvps(),
    ]);

    const visibleReservations = role === "admin"
      ? reservations
      : reservations.map((reservation) => ({
          id: reservation.id,
          giftId: reservation.giftId,
          giftName: reservation.giftName,
          guestName: "",
          guestContact: "",
          reservedAt: "",
        }));

    return Response.json({ role, party, gifts, reservations: visibleReservations, rsvps });
  } catch {
    return Response.json({ error: "Não foi possível carregar o painel." }, { status: 503 });
  }
}
