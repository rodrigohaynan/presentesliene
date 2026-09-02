import { getAvailableGifts, reserveGift } from "@/lib/party-store";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET() {
  try {
    return Response.json(
      { gifts: await getAvailableGifts() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível carregar a lista agora." },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      giftId?: unknown;
      name?: unknown;
      contact?: unknown;
    };
    const giftId = clean(body.giftId, 100);
    const name = clean(body.name, 80);
    const contact = clean(body.contact, 80);
    if (!giftId || name.length < 2) {
      return Response.json({ error: "Informe seu nome para confirmar a escolha." }, { status: 400 });
    }

    const result = await reserveGift(giftId, name, contact);
    if (!result.ok && result.reason === "not-found") {
      return Response.json({ error: "Esse presente não está mais disponível." }, { status: 404 });
    }
    if (!result.ok) {
      return Response.json({ error: "Esse presente acabou de ser escolhido por outra pessoa." }, { status: 409 });
    }

    return Response.json({ ok: true, reservation: result.reservation }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Não foi possível confirmar sua escolha. Tente novamente." },
      { status: 503 },
    );
  }
}
